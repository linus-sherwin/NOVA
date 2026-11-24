use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateFile {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub modified_timestamp: Option<u64>,
    pub is_recommended_to_keep: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub file_size_bytes: u64,
    pub copies_count: usize,
    pub total_wasted_bytes: u64,
    pub files: Vec<DuplicateFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateScanReport {
    pub total_groups: usize,
    pub total_duplicate_files: usize,
    pub total_reclaimable_bytes: u64,
    pub groups: Vec<DuplicateGroup>,
    pub elapsed_secs: f64,
}

/// Hashes the first 4,096 bytes of a file
fn compute_partial_hash<P: AsRef<Path>>(path: P) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut buffer = [0u8; 4096];
    let bytes_read = file.read(&mut buffer).ok()?;
    if bytes_read == 0 {
        return None;
    }
    let mut hasher = blake3::Hasher::new();
    hasher.update(&buffer[..bytes_read]);
    Some(hasher.finalize().to_hex().to_string())
}

/// Computes the complete cryptographic BLAKE3 digest of a file
fn compute_full_hash<P: AsRef<Path>>(path: P) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut hasher = blake3::Hasher::new();
    let mut buffer = [0u8; 65536];

    loop {
        let bytes_read = file.read(&mut buffer).ok()?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    Some(hasher.finalize().to_hex().to_string())
}

pub fn find_duplicates<P: AsRef<Path>>(
    root: P,
    min_size_bytes: u64,
    cancel_flag: Arc<AtomicBool>,
) -> Result<DuplicateScanReport, String> {
    let start_time = std::time::Instant::now();
    let root_path = root.as_ref();

    if !root_path.exists() {
        return Err(format!("Directory does not exist: {:?}", root_path));
    }

    // Stage 1: Group by file size
    let mut size_map: HashMap<u64, Vec<PathBuf>> = HashMap::new();

    for entry in walkdir::WalkDir::new(root_path)
        .follow_links(false)
        .same_file_system(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Scan cancelled by user".to_string());
        }

        if let Ok(meta) = entry.metadata() {
            if meta.is_file() && meta.len() >= min_size_bytes {
                size_map.entry(meta.len()).or_default().push(entry.path().to_path_buf());
            }
        }
    }

    // Filter to sizes with 2 or more files
    let candidate_sizes: Vec<(u64, Vec<PathBuf>)> = size_map
        .into_iter()
        .filter(|(_, files)| files.len() > 1)
        .collect();

    // Stage 2: Partial hash grouping
    let mut partial_hash_map: HashMap<(u64, String), Vec<PathBuf>> = HashMap::new();

    for (size, files) in candidate_sizes {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Scan cancelled by user".to_string());
        }

        for file_path in files {
            if let Some(partial_hash) = compute_partial_hash(&file_path) {
                partial_hash_map
                    .entry((size, partial_hash))
                    .or_default()
                    .push(file_path);
            }
        }
    }

    let candidate_partials: Vec<((u64, String), Vec<PathBuf>)> = partial_hash_map
        .into_iter()
        .filter(|(_, files)| files.len() > 1)
        .collect();

    // Stage 3: Full cryptographic BLAKE3 verification
    let mut full_hash_map: HashMap<(u64, String), Vec<PathBuf>> = HashMap::new();

    for ((size, _), files) in candidate_partials {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Scan cancelled by user".to_string());
        }

        for file_path in files {
            if let Some(full_hash) = compute_full_hash(&file_path) {
                full_hash_map
                    .entry((size, full_hash))
                    .or_default()
                    .push(file_path);
            }
        }
    }

    let mut groups = Vec::new();
    let mut total_duplicate_files = 0usize;
    let mut total_reclaimable_bytes = 0u64;

    for ((file_size_bytes, hash), file_paths) in full_hash_map {
        if file_paths.len() <= 1 {
            continue;
        }

        let mut files = Vec::new();
        for p in &file_paths {
            let name = p
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            let modified = p
                .metadata()
                .ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_secs());

            files.push(DuplicateFile {
                path: p.to_string_lossy().to_string(),
                name,
                size_bytes: file_size_bytes,
                modified_timestamp: modified,
                is_recommended_to_keep: false,
            });
        }

        // Recommendation: keep the oldest file (lowest modified timestamp), or first encountered
        if !files.is_empty() {
            let oldest_idx = files
                .iter()
                .enumerate()
                .min_by_key(|(_, f)| f.modified_timestamp.unwrap_or(u64::MAX))
                .map(|(idx, _)| idx)
                .unwrap_or(0);
            files[oldest_idx].is_recommended_to_keep = true;
        }

        let copies_count = files.len();
        let total_wasted_bytes = file_size_bytes * (copies_count.saturating_sub(1) as u64);

        total_duplicate_files += copies_count.saturating_sub(1);
        total_reclaimable_bytes += total_wasted_bytes;

        groups.push(DuplicateGroup {
            hash,
            file_size_bytes,
            copies_count,
            total_wasted_bytes,
            files,
        });
    }

    // Sort groups by total wasted space descending
    groups.sort_by(|a, b| b.total_wasted_bytes.cmp(&a.total_wasted_bytes));

    let total_groups = groups.len();
    let elapsed_secs = start_time.elapsed().as_secs_f64();

    Ok(DuplicateScanReport {
        total_groups,
        total_duplicate_files,
        total_reclaimable_bytes,
        groups,
        elapsed_secs,
    })
}
