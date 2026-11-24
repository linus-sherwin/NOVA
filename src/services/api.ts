import { invoke } from "@tauri-apps/api/core";
import { QuickScanTarget, ScanResult } from "../types/scan";
import { CleanupPreview, CleanupReport } from "../types/cleanup";
import { DuplicateScanReport } from "../types/duplicates";
import { InstalledApp } from "../types/applications";
import {
  PermissionStatus,
  ScanRecord,
  StorageTrendPoint,
  SystemStorageOverview,
} from "../types/storage";

export const api = {
  // Scans
  startScan: (path: string, minLargeFileMb?: number): Promise<ScanResult> =>
    invoke("start_scan", { path, minLargeFileMb }),

  cancelScan: (): Promise<void> => invoke("cancel_scan"),

  getQuickTargets: (): Promise<QuickScanTarget[]> =>
    invoke("get_quick_targets"),

  // Cleanup
  previewCleanup: (paths: string[]): Promise<CleanupPreview> =>
    invoke("preview_cleanup", { paths }),

  executeCleanup: (paths: string[]): Promise<CleanupReport> =>
    invoke("execute_cleanup", { paths }),

  // Duplicates
  findDuplicates: (
    path: string,
    minSizeMb?: number,
  ): Promise<DuplicateScanReport> =>
    invoke("find_duplicate_files", { path, minSizeMb }),

  cancelDuplicateScan: (): Promise<void> => invoke("cancel_duplicate_scan"),

  // Applications
  getInstalledApplications: (): Promise<InstalledApp[]> =>
    invoke("get_installed_applications"),

  // Storage & System
  getSystemStorage: (): Promise<SystemStorageOverview> =>
    invoke("get_system_storage"),

  getScanHistory: (limit?: number): Promise<ScanRecord[]> =>
    invoke("get_scan_history", { limit }),

  getStorageTrends: (): Promise<StorageTrendPoint[]> =>
    invoke("get_storage_trends"),

  checkPermissions: (): Promise<PermissionStatus> =>
    invoke("check_app_permissions"),

  openFullDiskAccess: (): Promise<void> => invoke("open_full_disk_access"),

  revealInFinder: (path: string): Promise<void> =>
    invoke("reveal_path_in_finder", { path }),

  openFile: (path: string): Promise<void> =>
    invoke("open_target_file", { path }),
};

