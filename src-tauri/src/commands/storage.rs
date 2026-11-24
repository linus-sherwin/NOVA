use crate::database::models::{ScanRecord, StorageTrendPoint};
use crate::database::repository::Database;
use crate::engine::storage_analyzer::{get_storage_overview, SystemStorageOverview};
use crate::macos::finder::{open_file, reveal_in_finder};
use crate::macos::permissions::open_full_disk_access_settings;
use crate::safety::permission_manager::{check_permissions, PermissionStatus};

#[tauri::command]
pub fn get_system_storage() -> SystemStorageOverview {
    let overview = get_storage_overview();
    // Record snapshot
    if let Ok(db) = Database::new() {
        let _ = db.record_storage_snapshot(
            overview.total_system_bytes,
            overview.used_system_bytes,
            overview.available_system_bytes,
        );
    }
    overview
}

#[tauri::command]
pub fn get_scan_history(limit: Option<usize>) -> Result<Vec<ScanRecord>, String> {
    let db = Database::new().map_err(|e| format!("Database error: {}", e))?;
    db.list_scans(limit.unwrap_or(20))
        .map_err(|e| format!("Query error: {}", e))
}

#[tauri::command]
pub fn get_storage_trends() -> Result<Vec<StorageTrendPoint>, String> {
    let db = Database::new().map_err(|e| format!("Database error: {}", e))?;
    db.get_storage_trends()
        .map_err(|e| format!("Query error: {}", e))
}

#[tauri::command]
pub fn check_app_permissions() -> PermissionStatus {
    check_permissions()
}

#[tauri::command]
pub fn open_full_disk_access() -> Result<(), String> {
    open_full_disk_access_settings()
}

#[tauri::command]
pub fn reveal_path_in_finder(path: String) -> Result<(), String> {
    reveal_in_finder(&path)
}

#[tauri::command]
pub fn open_target_file(path: String) -> Result<(), String> {
    open_file(&path)
}

