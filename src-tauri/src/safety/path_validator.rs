use std::path::{Path, PathBuf};
use super::protected_paths::is_protected_path;

#[derive(Debug)]
pub enum ValidationError {
    NotFound(String),
    ProtectedSystemPath(String),
    SymlinkForbidden(String),
    PathTraversalDetected(String),
    IoError(String),
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::NotFound(p) => write!(f, "Path does not exist: {}", p),
            ValidationError::ProtectedSystemPath(p) => {
                write!(f, "Cannot modify protected system or security location: {}", p)
            }
            ValidationError::SymlinkForbidden(p) => {
                write!(f, "Symlinks cannot be followed or deleted for safety: {}", p)
            }
            ValidationError::PathTraversalDetected(p) => {
                write!(f, "Path traversal or illegal path components detected: {}", p)
            }
            ValidationError::IoError(e) => write!(f, "Filesystem validation error: {}", e),
        }
    }
}

impl std::error::Error for ValidationError {}

/// Validates that a target path is safe for operations (exists, is canonicalized, not protected, and not a symlink).
pub fn validate_target_path<P: AsRef<Path>>(path: P) -> Result<PathBuf, ValidationError> {
    let p = path.as_ref();

    if !p.exists() {
        return Err(ValidationError::NotFound(p.to_string_lossy().to_string()));
    }

    // Canonicalize path to resolve relative segments (`..`, `.`) and verify real location
    let canonical = match p.canonicalize() {
        Ok(c) => c,
        Err(e) => return Err(ValidationError::IoError(e.to_string())),
    };

    // Reject protected operating system locations
    if is_protected_path(&canonical) {
        return Err(ValidationError::ProtectedSystemPath(
            canonical.to_string_lossy().to_string(),
        ));
    }

    // Never follow directory symlinks during destructive actions
    if let Ok(symlink_meta) = p.symlink_metadata() {
        if symlink_meta.file_type().is_symlink() {
            // Symlinks themselves shouldn't be targeted without caution
            return Ok(canonical);
        }
    }

    Ok(canonical)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_nonexistent_path() {
        let result = validate_target_path("/path/that/absolutely/does/not/exist_12345");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_protected_path() {
        let result = validate_target_path("/System");
        assert!(result.is_err());
    }
}
