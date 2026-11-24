use std::process::Command;

/// Launches macOS System Settings directly focused on the Privacy & Security -> Full Disk Access pane
pub fn open_full_disk_access_settings() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
        .spawn()
        .map_err(|e| format!("Failed to open macOS System Settings: {}", e))?;
    Ok(())
}

