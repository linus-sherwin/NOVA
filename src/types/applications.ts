export interface AppAssociatedFile {
  path: string;
  name: string;
  size_bytes: number;
  file_type: string;
  is_confirmed: boolean;
}

export interface InstalledApp {
  name: string;
  bundle_id?: string;
  version?: string;
  app_path: string;
  app_size_bytes: number;
  associated_files: AppAssociatedFile[];
  total_footprint_bytes: number;
  last_modified?: number;
}

