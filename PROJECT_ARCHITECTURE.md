# NOVA — Project Architecture

## 1. System Overview

**NOVA** is a high-performance, native-grade macOS disk space analyzer and intelligent cleanup utility. It combines a Rust systems backend with a modern desktop UI powered by Tauri 2, React, TypeScript, Tailwind CSS, and D3.js.

The architecture strictly decouples the high-performance filesystem engine (Rust) from the interactive presentation tier (React/TypeScript), communicating via strongly-typed Tauri IPC commands and asynchronous event streams.

```
+---------------------------------------------------------------------------------+
|                                Frontend (Tauri Webview)                         |
|  React 18 + TypeScript + Tailwind CSS + D3.js (Sunburst/Treemap) + Lucide Icons |
|                                                                                 |
|  [Overview] [Disk Analyzer] [Cleanup] [Large Files] [Duplicates] [Apps] [History]
+---------------------------------------------------------------------------------+
                                      | Tauri IPC (invoke & event streams)
                                      v
+---------------------------------------------------------------------------------+
|                           Rust Core Engine (src-tauri)                          |
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  |     commands/      |  |       engine/        |  |         safety/         |  |
|  |  - scan.rs         |  |  - scanner.rs        |  |  - protected_paths.rs   |  |
|  |  - cleanup.rs      |  |  - directory_tree.rs |  |  - deletion_service.rs  |  |
|  |  - duplicates.rs   |  |  - metadata.rs       |  |  - path_validator.rs    |  |
|  |  - applications.rs |  |  - file_classifier.rs|  |  - permission_manager.rs|  |
|  |  - storage.rs      |  |  - duplicate_finder.r|  +-------------------------+  |
|  +--------------------+  +----------------------+                               |
|                                                                                 |
|  +--------------------+  +----------------------+                               |
|  |     database/      |  |        macos/        |                               |
|  |  - models.rs       |  |  - trash.rs          |                               |
|  |  - repository.rs   |  |  - permissions.rs    |                               |
|  |  - migrations.rs   |  |  - volume.rs         |                               |
|  +--------------------+  +----------------------+                               |
+---------------------------------------------------------------------------------+
                                      | System Calls / I/O
                                      v
+---------------------------------------------------------------------------------+
|                       macOS APFS / HFS+ Filesystem & OS APIs                   |
|            (sysinfo, walkdir, trash, stat, NSWorkspace, TCC / FDA)              |
+---------------------------------------------------------------------------------+
```

---

## 2. Backend Architecture (`src-tauri`)

### 2.1 Directory Structure
```
src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── src/
│   ├── main.rs                 # Tauri application entry point and runner
│   ├── lib.rs                  # Module declarations and command registration
│   │
│   ├── commands/               # Tauri IPC command handlers
│   │   ├── mod.rs
│   │   ├── scan.rs             # Start, pause, cancel scan; stream progress
│   │   ├── cleanup.rs          # Scan cleanup targets, execute safe trash operations
│   │   ├── duplicates.rs       # Multi-stage duplicate file detection
│   │   ├── applications.rs     # Scan installed apps and orphaned ~/Library files
│   │   └── storage.rs          # Volume info, system stats, history queries
│   │
│   ├── engine/                 # Core filesystem analysis & algorithms
│   │   ├── mod.rs
│   │   ├── scanner.rs          # High-throughput asynchronous directory walker
│   │   ├── directory_tree.rs   # Hierarchical memory-efficient node representation
│   │   ├── metadata.rs         # File attributes, timestamps, hidden/symlink flags
│   │   ├── file_classifier.rs  # MIME/extension and cache/temp file categorizer
│   │   ├── duplicate_detector.rs# Size -> partial chunk hash -> full BLAKE3/SHA-256
│   │   └── storage_analyzer.rs # Aggregate statistics, volume capacity & usage
│   │
│   ├── safety/                 # Guardrails and destructive operation controls
│   │   ├── mod.rs
│   │   ├── protected_paths.rs  # System blacklist (/System, /usr, /bin, etc.)
│   │   ├── deletion_service.rs # Staged deletion strictly using macOS Trash API
│   │   ├── path_validator.rs   # Canonicalization, symlink loop & traversal defense
│   │   └── permission_manager.rs# Detection of Full Disk Access & TCC state
│   │
│   ├── database/               # Local persistence using SQLite (rusqlite)
│   │   ├── mod.rs
│   │   ├── models.rs           # Scan summary, history entry, cleanup log structs
│   │   ├── repository.rs       # Query interface for historical storage trends
│   │   └── migrations.rs       # Embedded SQLite DDL migrations
│   │
│   └── macos/                  # Native platform integrations
│       ├── mod.rs
│       ├── finder.rs           # Reveal in Finder, launch application
│       ├── trash.rs            # Native macOS Trash integration
│       ├── permissions.rs      # Full Disk Access check via test file probes
│       └── volume.rs           # Volume mount points, APFS statistics, free space
```

### 2.2 Concurrency & Threading Model
- **Non-blocking UI**: All filesystem traversals run on Tokio worker threads or dedicated background threads.
- **Bounded Concurrency**: Uses an asynchronous directory queue with bounded worker pools to prevent file descriptor exhaustion (`EMFILE`).
- **Progress Streaming**: Progress is throttled (e.g. at 50ms intervals) and streamed to the frontend over Tauri events (`scan:progress`), minimizing IPC overhead while delivering a silky 60fps UI.
- **Atomic Cancellation**: Every active scan holds an `Arc<AtomicBool>` / `CancellationToken`. Checking cancellation at each directory traversal step ensures instant, responsive stops without leaving abandoned threads.

### 2.3 Memory-Efficient Hierarchical File Tree
- Filesystem nodes store lightweight relative paths, aggregate sizes, and file counts.
- Large directories are pruned or tiered during serialization for D3 Sunburst/Treemap visualization (e.g. grouping small files below a threshold into an "Other" cluster), ensuring the frontend never receives millions of individual DOM-choking nodes.

---

## 3. Frontend Architecture (`src`)

### 3.1 Directory Structure
```
src/
├── index.html
├── main.tsx                    # React root
├── App.tsx                     # Main layout and tab orchestrator
│
├── components/                 # Reusable UI primitives
│   ├── ui/                     # Button, Card, Dialog, Badge, Input, Select, Tooltip
│   ├── layout/                 # Sidebar, Header, WindowFrame, Breadcrumbs
│   ├── charts/                 # D3 Sunburst, D3 Treemap, Recharts Storage Chart
│   └── common/                 # EmptyState, ErrorBoundary, ProgressBar, ConfirmModal
│
├── pages/                      # Primary application views
│   ├── Overview/               # System overview, storage gauge, quick actions
│   ├── DiskAnalyzer/           # Sunburst / Treemap / List visualizer + file breadcrumb
│   ├── Cleanup/                # System caches, dev caches, browser data categories
│   ├── LargeFiles/             # Filterable large files table with size thresholds
│   ├── DuplicateFinder/        # Grouped duplicate file cards with diffs & retention pick
│   ├── Applications/           # App list, sizes, and associated ~/Library support files
│   ├── StorageHistory/         # Historical growth charts and scan-to-scan diffs
│   └── Settings/               # Theme, default paths, exclusions, permissions
│
├── hooks/                      # Custom React hooks
│   ├── useScan.ts              # Initiates and tracks active filesystem scans
│   ├── useStorageInfo.ts       # Queries volume disk stats and capacity
│   ├── useTheme.ts             # Light/dark mode switching with system preference sync
│   └── usePermissions.ts       # Monitors Full Disk Access status
│
├── services/                   # Tauri IPC wrappers
│   ├── api.ts                  # Typed wrapper around `invoke`
│   └── events.ts               # Typed Tauri event listeners
│
├── types/                      # Shared TypeScript interface definitions
│   ├── scan.ts                 # FileNode, ScanProgress, ScanResult
│   ├── cleanup.ts              # CleanupCategory, CleanupItem, CleanupReport
│   ├── duplicates.ts           # DuplicateGroup, DuplicateFile
│   ├── application.ts          # AppInfo, AppAssociatedFile
│   └── storage.ts              # VolumeInfo, StorageSnapshot
│
└── utils/                      # Formatting & helper utilities
    ├── formatters.ts           # Byte formatting (KB, MB, GB, TB), dates, percentages
    └── fileIcons.tsx           # Category-to-icon mapping
```

### 3.2 Visual Design System
- **Theme Support**: Seamless Dark Mode and Light Mode with automatic macOS system appearance synchronization.
- **Palette**: Deep slate/charcoal neutrals (`#0D1117`, `#161B22`, `#21262D` in dark mode; `#F8FAFC`, `#FFFFFF`, `#E2E8F0` in light mode) paired with subtle Apple system blue accents (`#0A84FF` / `#007AFF`).
- **Typography**: Native macOS font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`).
- **Interactive Visualizations**: High-performance SVG/Canvas D3 Sunburst with fluid zoom-in/zoom-out transitions, responsive breadcrumb trail, and hover tooltips.

---

## 4. Key Data Flows

### 4.1 Disk Scan Flow
1. User clicks **"Scan Macintosh HD"** or selects a custom directory in **Disk Analyzer**.
2. Frontend calls `invoke("start_scan", { path, options })`.
3. Rust engine spawns a background Tokio task with a unique scan ID and cancellation token.
4. Traversal iterates files via `walkdir` / custom async walker, classifying file types and accumulating directory sizes.
5. Periodic progress events (`scan:progress`) stream processed counts, current path, and elapsed time to the UI.
6. Upon completion, a serialized hierarchical `DirectoryTree` is saved to SQLite history and returned to the frontend.
7. Frontend renders the D3 Sunburst chart, Treemap, and tabular file list simultaneously.

### 4.2 Safe Cleanup Execution Flow
1. User reviews categorized items (e.g., Xcode DerivedData, Caches).
2. User selects specific categories or files and clicks **"Review & Clean"**.
3. Frontend requests a preview via `invoke("preview_cleanup", { item_ids })`.
4. Rust validation engine canonicalizes each path, verifies it does NOT intersect any protected system path, and calculates the exact byte total.
5. User inspects the itemized confirmation dialog and clicks **"Move to Trash"**.
6. Rust engine moves items to macOS Trash using the native API (`trash::delete`).
7. Detailed `CleanupReport` is returned, logging successes, skips, and any OS-restricted files.

