use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

use crate::database::repository::Database;
use crate::engine::scanner::{ScanProgress, ScanResult, Scanner};
use crate::macos::volume::{get_quick_scan_targets, QuickScanTarget};

static SCAN_CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn start_scan(
    path: String,
    min_large_file_mb: Option<u64>,
    app: AppHandle,
) -> Result<ScanResult, String> {
    SCAN_CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    let cancel_flag = Arc::new(AtomicBool::new(false));
    // Bridge to local cancel flag
    let cancel_flag_clone = cancel_flag.clone();

    let target_path = PathBuf::from(&path);
    if !target_path.exists() {
        return Err(format!("Specified path does not exist: {}", path));
    }

    let min_large_file_bytes = min_large_file_mb.unwrap_or(100) * 1024 * 1024;
    let scanner = Scanner::new(cancel_flag);

    let app_clone = app.clone();
    let result = tokio::task::spawn_blocking(move || {
        scanner.scan_path(&target_path, min_large_file_bytes, |progress: ScanProgress| {
            if SCAN_CANCEL_FLAG.load(Ordering::Relaxed) {
                cancel_flag_clone.store(true, Ordering::SeqCst);
            }
            let _ = app_clone.emit("scan:progress", progress);
        })
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))??;

    // Save scan record in database
    if let Ok(db) = Database::new() {
        let _ = db.insert_scan(
            &result.root_path,
            result.total_bytes,
            result.total_files,
            result.total_directories,
            result.elapsed_secs,
        );
    }

    let _ = app.emit("scan:complete", &result);
    Ok(result)
}

#[tauri::command]
pub fn cancel_scan() {
    SCAN_CANCEL_FLAG.store(true, Ordering::SeqCst);
}

#[tauri::command]
pub fn get_quick_targets() -> Vec<QuickScanTarget> {
    get_quick_scan_targets()
}
