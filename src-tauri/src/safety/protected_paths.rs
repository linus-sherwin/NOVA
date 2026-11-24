use std::path::{Path, PathBuf};

/// Returns the set of canonical root system paths that must NEVER be modified or deleted.
pub fn get_protected_system_paths() -> Vec<PathBuf> {
    vec![
        PathBuf::from("/"),
        PathBuf::from("/System"),
        PathBuf::from("/usr"),
        PathBuf::from("/bin"),
        PathBuf::from("/sbin"),
        PathBuf::from("/private"),
        PathBuf::from("/etc"),
        PathBuf::from("/var"),
        PathBuf::from("/dev"),
        PathBuf::from("/Volumes"),
        PathBuf::from("/Library"),
        PathBuf::from("/Applications"),
        PathBuf::from("/cores"),
        PathBuf::from("/opt"),
    ]
}

/// Checks if a given path is a protected system directory or directly contains protected operating system files.
pub fn is_protected_path<P: AsRef<Path>>(path: P) -> bool {
    let p = path.as_ref();
    
    // Check exact matches or parent matches with critical system paths
    let protected = get_protected_system_paths();
    for sys_path in &protected {
        if p == sys_path {
            return true;
        }
    }

    // Never allow mutating anything inside /System, /usr, /bin, /sbin, /private/var/root
    if p.starts_with("/System")
        || p.starts_with("/usr")
        || p.starts_with("/bin")
        || p.starts_with("/sbin")
        || p.starts_with("/cores")
        || p.starts_with("/dev")
    {
        return true;
    }

    // In /Library, allow user-safe caches only (/Library/Caches), but block all essential system dirs
    if p.starts_with("/Library") {
        if !p.starts_with("/Library/Caches") {
            return true;
        }
    }

    // In user home directory, protect critical security & identity stores
    if let Some(home) = dirs::home_dir() {
        if p == home {
            return true;
        }
        let sensitive_user_paths = [
            home.join(".ssh"),
            home.join(".gnupg"),
            home.join(".config/security"),
            home.join("Library/Keychains"),
            home.join("Library/Mail"),
            home.join("Library/Messages"),
            home.join("Library/Accounts"),
            home.join("Library/IdentityServices"),
        ];

        for sensitive in &sensitive_user_paths {
            if p == sensitive || p.starts_with(sensitive) {
                return true;
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_paths_are_protected() {
        assert!(is_protected_path("/System"));
        assert!(is_protected_path("/System/Library"));
        assert!(is_protected_path("/usr/bin"));
        assert!(is_protected_path("/bin/zsh"));
        assert!(is_protected_path("/"));
    }

    #[test]
    fn test_user_cache_not_blocked_by_default() {
        if let Some(home) = dirs::home_dir() {
            let cache_path = home.join("Library/Caches/com.example.app");
            assert!(!is_protected_path(&cache_path));
        }
    }

    #[test]
    fn test_sensitive_user_paths_protected() {
        if let Some(home) = dirs::home_dir() {
            assert!(is_protected_path(home.join(".ssh")));
            assert!(is_protected_path(home.join(".ssh/id_rsa")));
            assert!(is_protected_path(home.join("Library/Keychains")));
        }
    }
}

