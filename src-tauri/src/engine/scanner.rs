use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use serde::{Deserialize, Serialize};

use super::directory_tree::TreeNode;
use super::file_classifier::{classify_cleanup_path, FileCategory};
use super::metadata::FileMetadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub files_scanned: usize,
    pub directories_scanned: usize,
    pub total_bytes: u64,
    pub current_directory: String,
    pub elapsed_secs: f64,
    pub is_cancelled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFileInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_timestamp: Option<u64>,
    pub category: FileCategory,
    pub parent_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredCleanupItem {
    pub category_name: String,
    pub description: String,
    pub path: String,
    pub size_bytes: u64,
    pub file_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub root_node: TreeNode,
    pub total_bytes: u64,
    pub total_files: usize,
    pub total_directories: usize,
    pub elapsed_secs: f64,
    pub large_files: Vec<LargeFileInfo>,
    pub cleanup_opportunities: Vec<DiscoveredCleanupItem>,
    pub category_breakdown: HashMap<FileCategory, u64>,
    pub root_path: String,
}

pub struct Scanner {
    cancel_flag: Arc<AtomicBool>,
}

impl Scanner {
    pub fn new(cancel_flag: Arc<AtomicBool>) -> Self {
        Self { cancel_flag }
    }

    pub fn scan_path<F>(
        &self,
        root_path: &Path,
        min_large_file_bytes: u64,
        mut on_progress: F,
    ) -> Result<ScanResult, String>
    where
        F: FnMut(ScanProgress),
    {
        if !root_path.exists() {
            return Err(format!("Path does not exist: {:?}", root_path));
        }

        let start_time = Instant::now();
        let mut files_scanned = 0usize;
        let mut directories_scanned = 0usize;
        let mut total_bytes = 0u64;
        let mut last_progress_emit = Instant::now();

        let mut large_files: Vec<LargeFileInfo> = Vec::new();
        let mut cleanup_map: HashMap<String, DiscoveredCleanupItem> = HashMap::new();
        let mut category_breakdown: HashMap<FileCategory, u64> = HashMap::new();

        // Build hierarchical tree
        let root_name = root_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| root_path.to_string_lossy().to_string());

        let mut root_node = TreeNode::new(
            root_path.to_string_lossy().to_string(),
            root_name,
            root_path.to_string_lossy().to_string(),
            true,
            FileCategory::Other,
        );

        // Keep a map of path -> TreeNode to efficiently reconstruct hierarchy
        let mut node_map: HashMap<PathBuf, TreeNode> = HashMap::new();
        node_map.insert(root_path.to_path_buf(), root_node.clone());

        let walker = walkdir::WalkDir::new(root_path)
            .follow_links(false)
            .same_file_system(true)
            .into_iter();

        for entry_res in walker {
            if self.cancel_flag.load(Ordering::Relaxed) {
                return Err("Scan cancelled by user".to_string());
            }

            let entry = match entry_res {
                Ok(e) => e,
                Err(_) => continue, // Gracefully bypass unreadable/permission-locked entries
            };

            let p = entry.path();
            if p == root_path {
                continue;
            }

            if let Ok(meta) = FileMetadata::from_path(p) {
                if meta.is_dir {
                    directories_scanned += 1;
                    let node = TreeNode::new(
                        meta.path.clone(),
                        meta.name.clone(),
                        meta.path.clone(),
                        true,
                        FileCategory::Other,
                    );
                    node_map.insert(p.to_path_buf(), node);

                    // Check if this directory is a known cleanup opportunity
                    if let Some((_, cat_name, desc)) = classify_cleanup_path(p) {
                        cleanup_map.entry(p.to_string_lossy().to_string()).or_insert_with(|| {
                            DiscoveredCleanupItem {
                                category_name: cat_name.to_string(),
                                description: desc.to_string(),
                                path: p.to_string_lossy().to_string(),
                                size_bytes: 0,
                                file_count: 0,
                            }
                        });
                    }
                } else {
                    files_scanned += 1;
                    total_bytes += meta.size_bytes;

                    let cat = FileCategory::from_extension(meta.extension.as_deref());
                    *category_breakdown.entry(cat).or_insert(0) += meta.size_bytes;

                    // Large file check
                    if meta.size_bytes >= min_large_file_bytes {
                        let parent_dir = p
                            .parent()
                            .map(|d| d.to_string_lossy().to_string())
                            .unwrap_or_default();

                        large_files.push(LargeFileInfo {
                            name: meta.name.clone(),
                            path: meta.path.clone(),
                            size_bytes: meta.size_bytes,
                            modified_timestamp: meta.modified_timestamp,
                            category: cat,
                            parent_dir,
                        });
                    }

                    // Check cleanup attribution
                    for (cleanup_dir, cleanup_item) in cleanup_map.iter_mut() {
                        if p.starts_with(cleanup_dir) {
                            cleanup_item.size_bytes += meta.size_bytes;
                            cleanup_item.file_count += 1;
                        }
                    }

                    let file_node = TreeNode {
                        id: meta.path.clone(),
                        name: meta.name,
                        path: meta.path,
                        size_bytes: meta.size_bytes,
                        file_count: 1,
                        is_dir: false,
                        category: cat,
                        children: Vec::new(),
                    };

                    if let Some(parent) = p.parent() {
                        if let Some(parent_node) = node_map.get_mut(parent) {
                            parent_node.children.push(file_node);
                            parent_node.size_bytes += meta.size_bytes;
                            parent_node.file_count += 1;
                        }
                    }
                }
            }

            // Stream throttled progress (every 60ms)
            if last_progress_emit.elapsed().as_millis() >= 60 {
                last_progress_emit = Instant::now();
                on_progress(ScanProgress {
                    files_scanned,
                    directories_scanned,
                    total_bytes,
                    current_directory: p.to_string_lossy().to_string(),
                    elapsed_secs: start_time.elapsed().as_secs_f64(),
                    is_cancelled: false,
                });
            }
        }

        // Propagate directory sizes upwards from deepest paths to root
        let mut sorted_paths: Vec<PathBuf> = node_map.keys().cloned().collect();
        sorted_paths.sort_by(|a, b| b.components().count().cmp(&a.components().count()));

        for path in sorted_paths {
            if path == root_path {
                continue;
            }
            if let Some(child_node) = node_map.remove(&path) {
                if let Some(parent) = path.parent() {
                    if let Some(parent_node) = node_map.get_mut(parent) {
                        parent_node.size_bytes += child_node.size_bytes;
                        parent_node.file_count += child_node.file_count;
                        parent_node.children.push(child_node);
                    }
                }
            }
        }

        if let Some(mut root) = node_map.remove(root_path) {
            root.sort_by_size();
            root_node = root;
        }

        large_files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        let mut cleanup_opportunities: Vec<DiscoveredCleanupItem> = cleanup_map
            .into_iter()
            .map(|(_, item)| item)
            .filter(|item| item.size_bytes > 0)
            .collect();
        cleanup_opportunities.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

        let elapsed_secs = start_time.elapsed().as_secs_f64();

        Ok(ScanResult {
            root_node,
            total_bytes,
            total_files: files_scanned,
            total_directories: directories_scanned,
            elapsed_secs,
            large_files,
            cleanup_opportunities,
            category_breakdown,
            root_path: root_path.to_string_lossy().to_string(),
        })
    }
}

