use serde::{Deserialize, Serialize};
use sysinfo::Disks;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskVolume {
    pub name: String,
    pub mount_point: String,
    pub total_space_bytes: u64,
    pub available_space_bytes: u64,
    pub used_space_bytes: u64,
    pub used_percentage: f64,
    pub file_system: String,
    pub is_removable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStorageOverview {
    pub primary_volume: Option<DiskVolume>,
    pub volumes: Vec<DiskVolume>,
    pub total_system_bytes: u64,
    pub available_system_bytes: u64,
    pub used_system_bytes: u64,
}

pub fn get_storage_overview() -> SystemStorageOverview {
    let disks = Disks::new_with_refreshed_list();
    let mut volumes = Vec::new();
    let mut total_system_bytes = 0u64;
    let mut available_system_bytes = 0u64;

    for disk in disks.list() {
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        let name = disk.name().to_string_lossy().to_string();
        let total_space_bytes = disk.total_space();
        let available_space_bytes = disk.available_space();
        let used_space_bytes = total_space_bytes.saturating_sub(available_space_bytes);
        let used_percentage = if total_space_bytes > 0 {
            (used_space_bytes as f64 / total_space_bytes as f64) * 100.0
        } else {
            0.0
        };

        let file_system = disk.file_system().to_string_lossy().to_string();
        let is_removable = disk.is_removable();

        // Count main volume
        if mount_point == "/" || mount_point == "/System/Volumes/Data" {
            total_system_bytes = total_space_bytes;
            available_system_bytes = available_space_bytes;
        }

        volumes.push(DiskVolume {
            name: if name.is_empty() { "Macintosh HD".to_string() } else { name },
            mount_point,
            total_space_bytes,
            available_space_bytes,
            used_space_bytes,
            used_percentage,
            file_system,
            is_removable,
        });
    }

    let primary_volume = volumes
        .iter()
        .find(|v| v.mount_point == "/" || v.mount_point == "/System/Volumes/Data")
        .cloned()
        .or_else(|| volumes.first().cloned());

    let used_system_bytes = total_system_bytes.saturating_sub(available_system_bytes);

    SystemStorageOverview {
        primary_volume,
        volumes,
        total_system_bytes,
        available_system_bytes,
        used_system_bytes,
    }
}

