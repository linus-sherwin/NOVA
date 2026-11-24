use crate::engine::applications::{scan_installed_applications, InstalledApp};

#[tauri::command]
pub async fn get_installed_applications() -> Result<Vec<InstalledApp>, String> {
    tokio::task::spawn_blocking(scan_installed_applications)
        .await
        .map_err(|e| format!("Failed to scan applications: {}", e))
}

