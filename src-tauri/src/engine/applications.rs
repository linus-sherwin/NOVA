use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppAssociatedFile {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub file_type: String, // e.g. "Application Support", "Cache", "Preferences", "Container", "Logs"
    pub is_confirmed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApp {
    pub name: String,
    pub bundle_id: Option<String>,
    pub version: Option<String>,
    pub app_path: String,
    pub app_size_bytes: u64,
    pub associated_files: Vec<AppAssociatedFile>,
    pub total_footprint_bytes: u64,
    pub last_modified: Option<u64>,
}

fn extract_info_plist_value(plist_content: &str, key: &str) -> Option<String> {
    let key_tag = format!("<key>{}</key>", key);
    let key_pos = plist_content.find(&key_tag)?;
    let after_key = &plist_content[key_pos + key_tag.len()..];
    
    // Find next <string>...</string>
    let string_start_tag = "<string>";
    let string_end_tag = "</string>";
    
    let start_pos = after_key.find(string_start_tag)?;
    let val_start = start_pos + string_start_tag.len();
    let val_end = after_key[val_start..].find(string_end_tag)?;
    
    Some(after_key[val_start..val_start + val_end].trim().to_string())
}

fn compute_dir_size<P: AsRef<Path>>(path: P) -> u64 {
    let mut total = 0u64;
    for entry in walkdir::WalkDir::new(path).follow_links(false).into_iter().filter_map(|e| e.ok()) {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                total += meta.len();
            }
        }
    }
    total
}

pub fn scan_installed_applications() -> Vec<InstalledApp> {
    let mut apps = Vec::new();
    let mut search_dirs = vec![PathBuf::from("/Applications")];
    if let Some(home) = dirs::home_dir() {
        search_dirs.push(home.join("Applications"));
    }

    for app_dir in search_dirs {
        if !app_dir.exists() {
            continue;
        }

        let entries = match std::fs::read_dir(&app_dir) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry_res in entries {
            let entry = match entry_res {
                Ok(e) => e,
                Err(_) => continue,
            };

            let path = entry.path();
            if path.extension().and_then(|ext| ext.to_str()) == Some("app") {
                let name = path
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Read Info.plist if available
                let info_plist = path.join("Contents/Info.plist");
                let mut bundle_id = None;
                let mut version = None;

                if info_plist.exists() {
                    if let Ok(mut f) = File::open(&info_plist) {
                        let mut content = String::new();
                        if f.read_to_string(&mut content).is_ok() {
                            bundle_id = extract_info_plist_value(&content, "CFBundleIdentifier");
                            version = extract_info_plist_value(&content, "CFBundleShortVersionString")
                                .or_else(|| extract_info_plist_value(&content, "CFBundleVersion"));
                        }
                    }
                }

                let app_size_bytes = compute_dir_size(&path);
                let last_modified = path
                    .metadata()
                    .ok()
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::SystemTime::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs());

                // Find associated files in ~/Library
                let mut associated_files = Vec::new();
                let mut total_footprint_bytes = app_size_bytes;

                if let Some(home) = dirs::home_dir() {
                    let library = home.join("Library");

                    // 1. Application Support
                    let app_support = library.join("Application Support");
                    let check_dirs = [
                        (app_support.join(&name), true),
                        (app_support.join(bundle_id.as_deref().unwrap_or("")), true),
                    ];
                    for (candidate, confirmed) in &check_dirs {
                        if candidate.exists() && candidate.is_dir() {
                            let sz = compute_dir_size(candidate);
                            total_footprint_bytes += sz;
                            associated_files.push(AppAssociatedFile {
                                path: candidate.to_string_lossy().to_string(),
                                name: candidate.file_name().unwrap_or_default().to_string_lossy().to_string(),
                                size_bytes: sz,
                                file_type: "Application Support".to_string(),
                                is_confirmed: *confirmed,
                            });
                        }
                    }

                    // 2. Caches
                    if let Some(ref bid) = bundle_id {
                        let cache_dir = library.join("Caches").join(bid);
                        if cache_dir.exists() {
                            let sz = compute_dir_size(&cache_dir);
                            total_footprint_bytes += sz;
                            associated_files.push(AppAssociatedFile {
                                path: cache_dir.to_string_lossy().to_string(),
                                name: bid.clone(),
                                size_bytes: sz,
                                file_type: "Cache".to_string(),
                                is_confirmed: true,
                            });
                        }
                    }

                    // 3. Preferences
                    if let Some(ref bid) = bundle_id {
                        let pref_file = library.join("Preferences").join(format!("{}.plist", bid));
                        if pref_file.exists() {
                            let sz = pref_file.metadata().map(|m| m.len()).unwrap_or(0);
                            total_footprint_bytes += sz;
                            associated_files.push(AppAssociatedFile {
                                path: pref_file.to_string_lossy().to_string(),
                                name: format!("{}.plist", bid),
                                size_bytes: sz,
                                file_type: "Preferences".to_string(),
                                is_confirmed: true,
                            });
                        }
                    }

                    // 4. Containers
                    if let Some(ref bid) = bundle_id {
                        let container_dir = library.join("Containers").join(bid);
                        if container_dir.exists() {
                            let sz = compute_dir_size(&container_dir);
                            total_footprint_bytes += sz;
                            associated_files.push(AppAssociatedFile {
                                path: container_dir.to_string_lossy().to_string(),
                                name: bid.clone(),
                                size_bytes: sz,
                                file_type: "Container (Sandbox)".to_string(),
                                is_confirmed: true,
                            });
                        }
                    }
                }

                // Dedup associated files by path
                associated_files.sort_by(|a, b| a.path.cmp(&b.path));
                associated_files.dedup_by(|a, b| a.path == b.path);

                apps.push(InstalledApp {
                    name,
                    bundle_id,
                    version,
                    app_path: path.to_string_lossy().to_string(),
                    app_size_bytes,
                    associated_files,
                    total_footprint_bytes,
                    last_modified,
                });
            }
        }
    }

    // Sort apps by total size descending
    apps.sort_by(|a, b| b.total_footprint_bytes.cmp(&a.total_footprint_bytes));
    apps
}

