export interface DeletionItemPreview {
  path: string;
  name: string;
  size_bytes: number;
  is_directory: boolean;
  is_safe: boolean;
  warning?: string;
}

export interface CleanupPreview {
  items: DeletionItemPreview[];
  total_size_bytes: number;
  total_count: number;
  has_unsafe_items: boolean;
}

export interface ItemResult {
  path: string;
  size_bytes: number;
  success: boolean;
  error?: string;
}

export interface CleanupReport {
  total_requested: number;
  succeeded_count: number;
  failed_count: number;
  skipped_count: number;
  bytes_freed: number;
  items: ItemResult[];
}

