export interface DiskVolume {
  name: string;
  mount_point: string;
  total_space_bytes: number;
  available_space_bytes: number;
  used_space_bytes: number;
  used_percentage: number;
  file_system: string;
  is_removable: boolean;
}

export interface SystemStorageOverview {
  primary_volume?: DiskVolume;
  volumes: DiskVolume[];
  total_system_bytes: number;
  available_system_bytes: number;
  used_system_bytes: number;
}

export interface ScanRecord {
  id: number;
  scanned_at: string;
  target_path: string;
  total_bytes: number;
  file_count: number;
  directory_count: number;
  elapsed_secs: number;
}

export interface StorageTrendPoint {
  date: string;
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
}

export interface PermissionStatus {
  has_full_disk_access: boolean;
  home_dir_accessible: boolean;
  downloads_accessible: boolean;
  documents_accessible: boolean;
  library_caches_accessible: boolean;
  description: string;
}

