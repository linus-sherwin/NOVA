use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use crate::engine::duplicate_detector::{find_duplicates, DuplicateScanReport};

static DUPLICATE_CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn find_duplicate_files(
    path: String,
    min_size_mb: Option<u64>,
) -> Result<DuplicateScanReport, String> {
    DUPLICATE_CANCEL_FLAG.store(false, Ordering::SeqCst);
    let cancel_flag = Arc::new(AtomicBool::new(false));
    let cancel_clone = cancel_flag.clone();

    let target_path = PathBuf::from(&path);
    if !target_path.exists() {
        return Err(format!("Specified path does not exist: {}", path));
    }

    let min_size_bytes = min_size_mb.unwrap_or(1) * 1024 * 1024;

    tokio::task::spawn_blocking(move || {
        if DUPLICATE_CANCEL_FLAG.load(Ordering::Relaxed) {
            cancel_clone.store(true, Ordering::SeqCst);
        }
        find_duplicates(&target_path, min_size_bytes, cancel_clone)
    })
    .await
    .map_err(|e| format!("Duplicate detection task failed: {}", e))?
}

#[tauri::command]
pub fn cancel_duplicate_scan() {
    DUPLICATE_CANCEL_FLAG.store(true, Ordering::SeqCst);
}

