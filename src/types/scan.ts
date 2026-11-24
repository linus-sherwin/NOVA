export type FileCategory =
  | "Video"
  | "Image"
  | "Audio"
  | "Archive"
  | "Document"
  | "Application"
  | "Code"
  | "Cache"
  | "Log"
  | "Other";

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  size_bytes: u64 | number;
  file_count: number;
  is_dir: boolean;
  category: FileCategory;
  children?: TreeNode[];
}

export interface ScanProgress {
  files_scanned: number;
  directories_scanned: number;
  total_bytes: number;
  current_directory: string;
  elapsed_secs: number;
  is_cancelled: boolean;
}

export interface LargeFileInfo {
  name: string;
  path: string;
  size_bytes: number;
  modified_timestamp?: number;
  category: FileCategory;
  parent_dir: string;
}

export interface DiscoveredCleanupItem {
  category_name: string;
  description: string;
  path: string;
  size_bytes: number;
  file_count: number;
}

export interface ScanResult {
  root_node: TreeNode;
  total_bytes: number;
  total_files: number;
  total_directories: number;
  elapsed_secs: number;
  large_files: LargeFileInfo[];
  cleanup_opportunities: DiscoveredCleanupItem[];
  category_breakdown: Record<string, number>;
  root_path: string;
}

export interface QuickScanTarget {
  id: string;
  name: string;
  path: string;
  icon_name: string;
  exists: boolean;
}

export type u64 = number;

