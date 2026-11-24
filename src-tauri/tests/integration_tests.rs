use std::fs::{self, File};
use std::io::Write;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tempfile::tempdir;

use nova_lib::engine::duplicate_detector::find_duplicates;
use nova_lib::engine::file_classifier::{classify_cleanup_path, FileCategory};
use nova_lib::engine::scanner::Scanner;
use nova_lib::safety::deletion_service::{execute_trash_deletion, preview_paths};
use nova_lib::safety::protected_paths::is_protected_path;

#[test]
fn test_filesystem_scanner_and_hierarchy() {
    let temp_dir = tempdir().expect("Failed to create temp dir");
    let root = temp_dir.path();

    // Create folder structure
    let dir_a = root.join("folder_a");
    let dir_b = dir_a.join("subfolder_b");
    let dir_c = root.join("folder_c");

    fs::create_dir_all(&dir_b).unwrap();
    fs::create_dir_all(&dir_c).unwrap();

    // Create files
    let mut f1 = File::create(dir_a.join("large_file.bin")).unwrap();
    f1.write_all(&vec![0u8; 100_000]).unwrap(); // 100 KB

    let mut f2 = File::create(dir_b.join("small_file.txt")).unwrap();
    f2.write_all(&vec![1u8; 10_000]).unwrap(); // 10 KB

    let mut f3 = File::create(dir_c.join("image.png")).unwrap();
    f3.write_all(&vec![2u8; 50_000]).unwrap(); // 50 KB

    let scanner = Scanner::new(Arc::new(AtomicBool::new(false)));
    let result = scanner
        .scan_path(root, 50_000, |_| {})
        .expect("Scan should succeed");

    assert_eq!(result.total_files, 3);
    assert_eq!(result.total_directories, 3);
    assert_eq!(result.total_bytes, 160_000);

    // Verify root node aggregation
    assert_eq!(result.root_node.size_bytes, 160_000);
    assert!(result.root_node.children.len() >= 2);

    // Verify large files discovery (>50KB)
    assert!(result.large_files.len() >= 2);
}

#[test]
fn test_duplicate_detection_engine() {
    let temp_dir = tempdir().expect("Failed to create temp dir");
    let root = temp_dir.path();

    let content_duplicate = b"IDENTICAL_CONTENT_FOR_BLAKE3_HASHING_TEST_1234567890";
    let content_unique = b"DIFFERENT_UNIQUE_CONTENT_FOR_BLAKE3_TEST_0987654321";

    let f1_path = root.join("file1.dat");
    let f2_path = root.join("file2.dat");
    let f3_path = root.join("file3.dat");
    let f4_unique = root.join("unique.dat");

    File::create(&f1_path).unwrap().write_all(content_duplicate).unwrap();
    File::create(&f2_path).unwrap().write_all(content_duplicate).unwrap();
    File::create(&f3_path).unwrap().write_all(content_duplicate).unwrap();
    File::create(&f4_unique).unwrap().write_all(content_unique).unwrap();

    let cancel_flag = Arc::new(AtomicBool::new(false));
    let report = find_duplicates(root, 10, cancel_flag)
        .expect("Duplicate search should succeed");

    assert_eq!(report.total_groups, 1);
    assert_eq!(report.groups[0].copies_count, 3);
    assert_eq!(report.groups[0].file_size_bytes, content_duplicate.len() as u64);
    assert_eq!(
        report.total_reclaimable_bytes,
        (content_duplicate.len() * 2) as u64
    );

    // Exactly one copy should be recommended to keep
    let keep_count = report.groups[0]
        .files
        .iter()
        .filter(|f| f.is_recommended_to_keep)
        .count();
    assert_eq!(keep_count, 1);
}

#[test]
fn test_file_classifier_categories() {
    assert_eq!(FileCategory::from_extension(Some("mp4")), FileCategory::Video);
    assert_eq!(FileCategory::from_extension(Some("png")), FileCategory::Image);
    assert_eq!(FileCategory::from_extension(Some("zip")), FileCategory::Archive);
    assert_eq!(FileCategory::from_extension(Some("pdf")), FileCategory::Document);
    assert_eq!(FileCategory::from_extension(Some("rs")), FileCategory::Code);
    assert_eq!(FileCategory::from_extension(Some("unknown_ext")), FileCategory::Other);

    // Test cleanup path classification
    let derived_data = std::path::PathBuf::from("/Users/test/Library/Developer/Xcode/DerivedData");
    assert!(classify_cleanup_path(&derived_data).is_some());

    let brew_cache = std::path::PathBuf::from("/Users/test/Library/Caches/Homebrew");
    assert!(classify_cleanup_path(&brew_cache).is_some());
}

#[test]
fn test_protected_paths_guardrail() {
    assert!(is_protected_path("/System"));
    assert!(is_protected_path("/System/Library"));
    assert!(is_protected_path("/usr"));
    assert!(is_protected_path("/bin"));
    assert!(is_protected_path("/sbin"));
    assert!(is_protected_path("/private"));
    assert!(is_protected_path("/"));
}

#[test]
fn test_safe_preview_and_trash() {
    let temp_dir = tempdir().expect("Failed to create temp dir");
    let file_path = temp_dir.path().join("trash_test_file.tmp");
    File::create(&file_path).unwrap().write_all(b"TRASH_ME").unwrap();

    let path_str = file_path.to_string_lossy().to_string();

    // Preview
    let preview = preview_paths(&[path_str.clone()]);
    assert_eq!(preview.total_count, 1);
    assert_eq!(preview.total_size_bytes, 8);
    assert!(preview.items[0].is_safe);

    // Deletion
    let report = execute_trash_deletion(&[path_str]);
    assert_eq!(report.succeeded_count, 1);
    assert_eq!(report.bytes_freed, 8);
}

