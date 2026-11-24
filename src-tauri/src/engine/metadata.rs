use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub is_hidden: bool,
    pub modified_timestamp: Option<u64>,
    pub created_timestamp: Option<u64>,
    pub extension: Option<String>,
}

impl FileMetadata {
    pub fn from_path<P: AsRef<Path>>(path: P) -> std::io::Result<Self> {
        let p = path.as_ref();
        let symlink_meta = p.symlink_metadata()?;
        let is_symlink = symlink_meta.file_type().is_symlink();
        
        let meta = if is_symlink {
            // Do not follow symlinks
            symlink_meta
        } else {
            p.metadata().unwrap_or(symlink_meta)
        };

        let is_dir = meta.is_dir();
        let size_bytes = if is_dir { 0 } else { meta.len() };

        let name = p
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| p.to_string_lossy().to_string());

        let is_hidden = name.starts_with('.') && name != "." && name != "..";

        let modified_timestamp = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        let created_timestamp = meta
            .created()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        let extension = p
            .extension()
            .map(|ext| ext.to_string_lossy().to_lowercase());

        Ok(FileMetadata {
            name,
            path: p.to_string_lossy().to_string(),
            size_bytes,
            is_dir,
            is_symlink,
            is_hidden,
            modified_timestamp,
            created_timestamp,
            extension,
        })
    }
}
