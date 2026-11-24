# NOVA — Development Roadmap

This document outlines the phased milestone roadmap for building the **NOVA** macOS Storage Analyzer & Cleanup Utility. Each milestone specifies explicit deliverables, engineering objectives, and verification gates.

---

## Milestone Overview

```
+---------------------------------------------------------------------------------+
| Phase 1: Foundation (Tauri 2, React, TypeScript, Tailwind, Design System)       |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 2: Filesystem Engine (Rust Traversal, Metadata, Progress Streaming, Stop) |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 3: Disk Analyzer (Sunburst Chart, Treemap, Breadcrumb, List View)         |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 4: Smart Cleanup (Caches, Temp, Dev Tools, Trash Deletion Engine)         |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 5: Advanced Features (Large Files, Duplicate Finder, App Leftovers)       |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 6: Storage Intelligence (SQLite Scan History, Diffing, Growth Tracking)   |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| Phase 7: Production Readiness (Permissions, Guardrails, Apple Silicon Build)    |
+---------------------------------------------------------------------------------+
```

---

## Phase 1 — Foundation
**Goal**: Establish the Tauri 2 + Rust + React/TypeScript workspace, design system, theme switching, and persistent navigation.

- [x] Configure Rust environment (`cargo`, `rustc`).
- [ ] Initialize Tauri 2 project configuration (`tauri.conf.json`, `Cargo.toml`, `package.json`).
- [ ] Install and configure React 18, TypeScript, Tailwind CSS, Lucide icons, and D3.
- [ ] Implement persistent sidebar navigation with primary tabs:
  1. Overview
  2. Disk Analyzer
  3. Cleanup
  4. Large Files
  5. Duplicate Finder
  6. Applications
  7. Storage History
  8. Settings
- [ ] Implement dark and light mode with macOS system appearance synchronization.
- [ ] Verification gate: Build and launch on macOS with zero runtime or styling errors.

---

## Phase 2 — Filesystem Engine
**Goal**: Implement the high-throughput asynchronous filesystem scanning engine in Rust.

- [ ] Implement `engine::scanner`:
  - Recursive directory traversal with `walkdir`.
  - Atomic cancellation via `tokio_util` / `AtomicBool`.
  - Bounded concurrency and file descriptor safety.
  - Symlink cycle avoidance (never traverse into symlinked directories).
  - Permission and unreadable directory error containment.
- [ ] Implement `engine::metadata`:
  - Exact file size and disk allocation block size.
  - Hidden file flag (`.` prefix and macOS `UF_HIDDEN`).
  - Timestamps (modification, creation, last access).
- [ ] Implement `engine::directory_tree`:
  - Lightweight hierarchy node aggregation.
  - Tree pruning for optimal serialization performance.
- [ ] Stream progress events (`scan:progress`) with:
  - Scanned file count.
  - Scanned directory count.
  - Bytes counted.
  - Current directory path.
  - Elapsed time.
- [ ] Verification gate: Run Rust unit tests for scanner, metadata collection, and traversal cancellation.

---

## Phase 3 — Disk Analyzer
**Goal**: Build interactive DaisyDisk-inspired storage visualisations.

- [ ] Implement DaisyDisk-inspired D3 Sunburst chart:
  - Root at center, nested rings for folders and files.
  - Interactive drill-down / zoom on click.
  - Hover tooltips with path, byte size, and parent percentage.
  - Smooth animation transitions.
- [ ] Implement interactive Treemap view:
  - Nested proportional rectangular partitioning.
  - Color-coded by file classification/depth.
- [ ] Implement List / Table view:
  - Sort by size, name, type, and modification date.
- [ ] Implement breadcrumb trail for navigation.
- [ ] Context actions: Reveal in Finder, Move to Trash, Inspect Details.
- [ ] Verification gate: Test with large directory hierarchies without UI freezes.

---

## Phase 4 — Smart Cleanup
**Goal**: Build safe, categorized cleanup detection and macOS Trash deletion.

- [ ] Categorization engine (`engine::file_classifier`):
  - **System & Application Caches**: User caches (`~/Library/Caches`), app cache directories.
  - **Temporary Files**: `~/Library/Logs`, temporary files, orphaned crash dumps.
  - **Browser Data**: Caches for Safari, Google Chrome, Firefox, Brave (strictly excluding passwords, session cookies, tokens, or history).
  - **Developer Caches**: Xcode DerivedData, Xcode Archives, iOS Simulator caches, npm cache, pnpm cache, Cargo target directories, Homebrew cache, Gradle caches.
- [ ] Safety & Deletion Engine (`safety/`):
  - Path canonicalization.
  - Protected path guardrails (`/System`, `/usr`, `/bin`, `/Library` critical files).
  - Mandatory move-to-trash (`trash::delete`).
  - Pre-deletion itemized preview with exact size breakdown.
  - Itemized execution reporting (`CleanupReport`).
- [ ] Verification gate: Safety unit tests verifying protected paths are rejected and files are placed in Trash.

---

## Phase 5 — Advanced Features
**Goal**: Large file discovery, content-verified duplicate finder, and application manager.

- [ ] **Large Files Tool**:
  - Filter by thresholds (>100MB, >500MB, >1GB, >5GB, custom).
  - Filter by category (Videos, Audio, Archives, Disk Images, Documents).
  - Sortable table with Finder integration.
- [ ] **Duplicate Finder**:
  - Stage 1: Size grouping.
  - Stage 2: First 4KB partial hash.
  - Stage 3: Full BLAKE3 / SHA-256 verification.
  - Duplicate groups with recommendation logic (preserve oldest/original).
  - Explicit user selection before trash action.
- [ ] **Application Manager**:
  - Scan `/Applications` and `~/Applications`.
  - Extract bundle ID, version, icon, and bundle size.
  - Scan associated files in `~/Library/Application Support`, `~/Library/Caches`, `~/Library/Preferences`, `~/Library/Containers`.
  - Clean uninstall flow with confirmed vs. uncertain relationship flagging.
- [ ] Verification gate: End-to-end duplicate detection and app inventory testing.

---

## Phase 6 — Storage Intelligence
**Goal**: Historical tracking, trend charts, and scan diffing.

- [ ] SQLite database setup (`rusqlite`) with automatic migration table.
- [ ] Save scan summaries: timestamp, root path, total size, file count, top directories.
- [ ] Storage History dashboard:
  - Usage over time line/bar chart (Recharts).
  - Scan comparison view: diff two scans to pinpoint directory growth.
- [ ] Verification gate: Database persistence across app reloads and accurate delta calculation.

---

## Phase 7 — Production Readiness
**Goal**: Permissions, performance tuning, hardening, and native macOS packaging.

- [ ] Full Disk Access (FDA) detection and guided macOS settings onboarding.
- [ ] Local-only privacy guarantee verification (no network telemetry).
- [ ] Memory and CPU profiling on Apple Silicon.
- [ ] Production build configuration: app bundle identifier `com.nova.storage`, icons, versioning.
- [ ] Verification gate: `cargo test` clean pass, TypeScript compiler clean pass, release build verification.

