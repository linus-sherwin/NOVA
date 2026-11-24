use std::path::Path;

pub fn move_to_trash<P: AsRef<Path>>(path: P) -> Result<(), String> {
    trash::delete(path.as_ref()).map_err(|e| format!("Failed to move file to Trash: {}", e))
}

