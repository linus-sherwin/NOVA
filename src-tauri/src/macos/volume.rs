use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickScanTarget {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_name: String,
    pub exists: bool,
}

pub fn get_quick_scan_targets() -> Vec<QuickScanTarget> {
    let mut targets = Vec::new();

    if let Some(home) = dirs::home_dir() {
        targets.push(QuickScanTarget {
            id: "home".to_string(),
            name: "Home Directory".to_string(),
            path: home.to_string_lossy().to_string(),
            icon_name: "Home".to_string(),
            exists: home.exists(),
        });

        let downloads = home.join("Downloads");
        targets.push(QuickScanTarget {
            id: "downloads".to_string(),
            name: "Downloads".to_string(),
            path: downloads.to_string_lossy().to_string(),
            icon_name: "Download".to_string(),
            exists: downloads.exists(),
        });

        let documents = home.join("Documents");
        targets.push(QuickScanTarget {
            id: "documents".to_string(),
            name: "Documents".to_string(),
            path: documents.to_string_lossy().to_string(),
            icon_name: "FileText".to_string(),
            exists: documents.exists(),
        });

        let desktop = home.join("Desktop");
        targets.push(QuickScanTarget {
            id: "desktop".to_string(),
            name: "Desktop".to_string(),
            path: desktop.to_string_lossy().to_string(),
            icon_name: "Monitor".to_string(),
            exists: desktop.exists(),
        });

        let pictures = home.join("Pictures");
        targets.push(QuickScanTarget {
            id: "pictures".to_string(),
            name: "Pictures".to_string(),
            path: pictures.to_string_lossy().to_string(),
            icon_name: "Image".to_string(),
            exists: pictures.exists(),
        });

        let movies = home.join("Movies");
        targets.push(QuickScanTarget {
            id: "movies".to_string(),
            name: "Movies".to_string(),
            path: movies.to_string_lossy().to_string(),
            icon_name: "Film".to_string(),
            exists: movies.exists(),
        });
    }

    let apps = PathBuf::from("/Applications");
    targets.push(QuickScanTarget {
        id: "applications".to_string(),
        name: "Applications".to_string(),
        path: apps.to_string_lossy().to_string(),
        icon_name: "Grid".to_string(),
        exists: apps.exists(),
    });

    let macintosh_hd = PathBuf::from("/");
    targets.push(QuickScanTarget {
        id: "macintosh_hd".to_string(),
        name: "Macintosh HD".to_string(),
        path: macintosh_hd.to_string_lossy().to_string(),
        icon_name: "HardDrive".to_string(),
        exists: macintosh_hd.exists(),
    });

    targets
}

