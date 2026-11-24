pub mod commands;
pub mod database;
pub mod engine;
pub mod macos;
pub mod safety;

use commands::applications::get_installed_applications;
use commands::cleanup::{execute_cleanup, preview_cleanup};
use commands::duplicates::{cancel_duplicate_scan, find_duplicate_files};
use commands::scan::{cancel_scan, get_quick_targets, start_scan};
use commands::storage::{
    check_app_permissions, get_scan_history, get_storage_trends, get_system_storage,
    open_full_disk_access, open_target_file, reveal_path_in_finder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            start_scan,
            cancel_scan,
            get_quick_targets,
            preview_cleanup,
            execute_cleanup,
            find_duplicate_files,
            cancel_duplicate_scan,
            get_installed_applications,
            get_system_storage,
            get_scan_history,
            get_storage_trends,
            check_app_permissions,
            open_full_disk_access,
            reveal_path_in_finder,
            open_target_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NOVA application");
}

