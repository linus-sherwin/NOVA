use crate::safety::deletion_service::{
    execute_trash_deletion, preview_paths, CleanupPreview, CleanupReport,
};

#[tauri::command]
pub fn preview_cleanup(paths: Vec<String>) -> CleanupPreview {
    preview_paths(&paths)
}

#[tauri::command]
pub fn execute_cleanup(paths: Vec<String>) -> CleanupReport {
    execute_trash_deletion(&paths)
}

