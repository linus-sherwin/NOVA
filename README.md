# NOVA — Premium macOS Storage Analyzer & Cleanup Utility

![macOS Sequoia](https://img.shields.io/badge/macOS-Sequoia%20%7C%20Tahoe-black?style=flat-square&logo=apple)
![Rust](https://img.shields.io/badge/Backend-Rust%202021-DEA584?style=flat-square&logo=rust)
![Tauri 2](https://img.shields.io/badge/Framework-Tauri%202-24C8D5?style=flat-square&logo=tauri)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)
![D3.js](https://img.shields.io/badge/Visualizations-D3.js-F9A03C?style=flat-square&logo=d3.js)

**NOVA** is a modern, high-performance disk space analyzer and intelligent cleanup application for macOS. Inspired by the visual elegance of DaisyDisk, the engineering rigor of Rust, and the minimalist aesthetic of Linear and Raycast, NOVA helps Mac users understand their disk usage, identify wasted storage, and safely reclaim gigabytes of space.

---

## Key Features

- **Interactive DaisyDisk-Style Sunburst Visualizer**: Explore your filesystem hierarchically with fluid zoom, drill-downs, hover tooltips, and instant breadcrumb navigation.
- **Alternative Visualizations**: Toggle seamlessly between Sunburst, Treemap, and tabular List views sorted by size, date, or name.
- **High-Throughput Rust Scanner**: Multi-threaded, asynchronous directory traversal with bounded concurrency, symlink loop protection, and real-time progress streaming.
- **Smart Cleanup Engine**:
  - User application & system caches (`~/Library/Caches`).
  - Developer artifacts (Xcode DerivedData, iOS Simulator caches, Homebrew, npm, pnpm, Cargo target builds, Gradle).
  - Safe browser caches (Safari, Chrome, Firefox — strictly excluding credentials, session tokens, or browsing history).
- **Large File Hunter**: Filter and reveal huge forgotten files across multiple size thresholds (>100MB, >500MB, >1GB, >5GB).
- **Cryptographic Duplicate Finder**: 3-stage duplicate detection (Size &rarr; 4KB partial header &rarr; Full BLAKE3/SHA-256) ensuring zero false positives.
- **Application Manager & Leftovers**: Inspect installed applications, package sizes, and detect orphaned files in `~/Library/Application Support`, `~/Library/Containers`, and `~/Library/Preferences`.
- **Historical Storage Intelligence**: Persists scan snapshots in an embedded SQLite database to track disk growth and diff usage between scans.
- **Zero Accidental Data Loss Guarantee**: All deletion operations move files to the native macOS Trash with mandatory itemized previews and strict system path guardrails.
- **100% Local & Private**: No analytics, no telemetry, no cloud accounts. All operations occur strictly on your Mac.

---

## Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Core** | Rust 2021, Tokio, WalkDir, Rusqlite, Serde, BLAKE3 / SHA-256 |
| **Desktop Framework** | Tauri 2 (Native macOS WebKit webview) |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Data Visualizations** | D3.js (Sunburst & Treemap), Recharts (Historical Trends) |
| **macOS Integration** | Native macOS Trash API, NSWorkspace, TCC Full Disk Access check |

---

## Project Structure

```
NOVA/
├── src-tauri/                 # Rust Core & Tauri 2 Integration
│   ├── src/
│   │   ├── commands/          # Tauri IPC Command Handlers
│   │   ├── engine/            # Scanner, Tree, Classifier, Duplicate Finder
│   │   ├── safety/            # Deletion Service, Protected Paths, Permissions
│   │   ├── database/          # SQLite History & Migrations
│   │   ├── macos/             # Platform APIs & Trash Integration
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                       # React 18 + TypeScript Frontend
│   ├── components/            # Charts (D3 Sunburst, Treemap), UI Primitives
│   ├── pages/                 # Overview, DiskAnalyzer, Cleanup, LargeFiles, etc.
│   ├── hooks/                 # React Hooks for scans, storage, permissions
│   ├── services/              # Tauri IPC client wrappers
│   ├── types/                 # Shared data contracts
│   ├── utils/                 # Formatters, icons, helpers
│   ├── App.tsx
│   └── main.tsx
│
├── PROJECT_ARCHITECTURE.md    # Detailed subsystem architecture
├── DEVELOPMENT_ROADMAP.md     # Milestone deliverables & verification gates
└── SECURITY_MODEL.md          # Guardrails, safety invariants & permissions
```

---

## Getting Started

### Prerequisites
- macOS 13+ (Ventura, Sonoma, Sequoia, or later). Apple Silicon (M1/M2/M3/M4) or Intel.
- [Rust toolchain](https://www.rust-lang.org/) (`rustc 1.75+`, `cargo`).
- [Node.js](https://nodejs.org/) (`v18+` or `v20+`) & `npm`.

### Installation & Development

1. **Clone and enter the workspace**:
   ```bash
   cd NOVA
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

4. **Run Rust test suite**:
   ```bash
   cd src-tauri && cargo test
   ```

5. **Build standalone macOS Application Bundle**:
   ```bash
   npm run tauri build
   ```

---

## Security & Safety

NOVA is engineered to protect macOS integrity:
1. **Never deletes system files**: Built-in blacklist protects `/System`, `/usr`, `/bin`, `/sbin`, `/private`, `/Library`, and APFS snapshots.
2. **Native Trash only**: Deletions are executed via macOS Trash, allowing complete user undo.
3. **No symlink following**: Prevents directory loops and out-of-scope modifications.
4. **Itemized confirmations**: Always displays exact paths, counts, and sizes before moving items to Trash.

---

## License

MIT License. Designed and engineered for macOS.
