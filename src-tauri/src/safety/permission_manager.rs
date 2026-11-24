use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionStatus {
    pub has_full_disk_access: bool,
    pub home_dir_accessible: bool,
    pub downloads_accessible: bool,
    pub documents_accessible: bool,
    pub library_caches_accessible: bool,
    pub description: String,
}

/// Probes key protected locations to determine whether Full Disk Access is granted by macOS TCC.
pub fn check_permissions() -> PermissionStatus {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/Users"));
    
    let home_accessible = std::fs::read_dir(&home).is_ok();
    let downloads = home.join("Downloads");
    let downloads_accessible = std::fs::read_dir(&downloads).is_ok();
    let documents = home.join("Documents");
    let documents_accessible = std::fs::read_dir(&documents).is_ok();
    let library_caches = home.join("Library/Caches");
    let library_caches_accessible = std::fs::read_dir(&library_caches).is_ok();

    // Standard TCC test probe for Full Disk Access on macOS:
    // Testing read access to ~/Library/Safari or /Library/Application Support/com.apple.TCC
    let safari_test = home.join("Library/Safari/CloudTabs.db");
    let mail_test = home.join("Library/Mail");

    let mut has_fda = false;
    if safari_test.exists() {
        if std::fs::File::open(&safari_test).is_ok() {
            has_fda = true;
        }
    } else if mail_test.exists() {
        if std::fs::read_dir(&mail_test).is_ok() {
            has_fda = true;
        }
    } else {
        // If test paths don't exist, check standard system directory access
        has_fda = documents_accessible && downloads_accessible && library_caches_accessible;
    }

    let description = if has_fda {
        "Full Disk Access is active. NOVA can scan all user and application directories."
            .to_string()
    } else {
        "Standard permissions. To scan all application caches and external locations, grant Full Disk Access in macOS System Settings."
            .to_string()
    };

    PermissionStatus {
        has_full_disk_access: has_fda,
        home_dir_accessible: home_accessible,
        downloads_accessible,
        documents_accessible,
        library_caches_accessible,
        description,
    }
}

