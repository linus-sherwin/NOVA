export interface DuplicateFile {
  path: string;
  name: string;
  size_bytes: number;
  modified_timestamp?: number;
  is_recommended_to_keep: boolean;
}

export interface DuplicateGroup {
  hash: string;
  file_size_bytes: number;
  copies_count: number;
  total_wasted_bytes: number;
  files: DuplicateFile[];
}

export interface DuplicateScanReport {
  total_groups: number;
  total_duplicate_files: number;
  total_reclaimable_bytes: number;
  groups: DuplicateGroup[];
  elapsed_secs: number;
}

