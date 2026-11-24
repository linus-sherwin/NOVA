use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use super::path_validator::validate_target_path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeletionItemPreview {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub is_directory: bool,
    pub is_safe: bool,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupPreview {
    pub items: Vec<DeletionItemPreview>,
    pub total_size_bytes: u64,
    pub total_count: usize,
    pub has_unsafe_items: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemResult {
    pub path: String,
    pub size_bytes: u64,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupReport {
    pub total_requested: usize,
    pub succeeded_count: usize,
    pub failed_count: usize,
    pub skipped_count: usize,
    pub bytes_freed: u64,
    pub items: Vec<ItemResult>,
}

/// Computes the exact recursive size of a file or directory for deletion preview.
pub fn calculate_path_size<P: AsRef<Path>>(path: P) -> (u64, bool) {
    let p = path.as_ref();
    if !p.exists() {
        return (0, false);
    }

    if let Ok(meta) = p.symlink_metadata() {
        if meta.is_dir() {
            let mut total_size = 0u64;
            for entry in walkdir::WalkDir::new(p)
                .follow_links(false)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if let Ok(m) = entry.metadata() {
                    if m.is_file() {
                        total_size += m.len();
                    }
                }
            }
            (total_size, true)
        } else {
            (meta.len(), false)
        }
    } else {
        (0, false)
    }
}

/// Generates a preview for a list of candidate paths before moving to Trash.
pub fn preview_paths(paths: &[String]) -> CleanupPreview {
    let mut items = Vec::new();
    let mut total_size_bytes = 0u64;
    let mut has_unsafe_items = false;

    for path_str in paths {
        let p = PathBuf::from(path_str);
        let name = p.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path_str.clone());

        match validate_target_path(&p) {
            Ok(canonical) => {
                let (size, is_dir) = calculate_path_size(&canonical);
                total_size_bytes += size;
                items.push(DeletionItemPreview {
                    path: path_str.clone(),
                    name,
                    size_bytes: size,
                    is_directory: is_dir,
                    is_safe: true,
                    warning: None,
                });
            }
            Err(err) => {
                has_unsafe_items = true;
                items.push(DeletionItemPreview {
                    path: path_str.clone(),
                    name,
                    size_bytes: 0,
                    is_directory: false,
                    is_safe: false,
                    warning: Some(err.to_string()),
                });
            }
        }
    }

    let total_count = items.len();
    CleanupPreview {
        items,
        total_size_bytes,
        total_count,
        has_unsafe_items,
    }
}

/// Safely moves verified items to the macOS Trash.
pub fn execute_trash_deletion(paths: &[String]) -> CleanupReport {
    let mut report = CleanupReport {
        total_requested: paths.len(),
        succeeded_count: 0,
        failed_count: 0,
        skipped_count: 0,
        bytes_freed: 0,
        items: Vec::new(),
    };

    for path_str in paths {
        let p = PathBuf::from(path_str);

        // Stage 1: Validate against protected system paths and symlink traps
        let canonical_path = match validate_target_path(&p) {
            Ok(cp) => cp,
            Err(err) => {
                report.skipped_count += 1;
                report.items.push(ItemResult {
                    path: path_str.clone(),
                    size_bytes: 0,
                    success: false,
                    error: Some(format!("Skipped by safety guardrail: {}", err)),
                });
                continue;
            }
        };

        let (size, _) = calculate_path_size(&canonical_path);

        // Stage 2: Move to macOS native Trash
        match trash::delete(&canonical_path) {
            Ok(_) => {
                report.succeeded_count += 1;
                report.bytes_freed += size;
                report.items.push(ItemResult {
                    path: path_str.clone(),
                    size_bytes: size,
                    success: true,
                    error: None,
                });
            }
            Err(err) => {
                report.failed_count += 1;
                report.items.push(ItemResult {
                    path: path_str.clone(),
                    size_bytes: size,
                    success: false,
                    error: Some(format!("Failed to move to Trash: {}", err)),
                });
            }
        }
    }

    report
}

