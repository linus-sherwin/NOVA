# NOVA — Security & Safety Model

Data safety is the foundational invariant of **NOVA**. Storage management software operates on sensitive user and system files; therefore, NOVA is designed under the principle of **zero accidental data loss** and **zero privilege overreach**.

---

## 1. Core Principles

1. **Trash-First Protocol**: Files are never unlinked permanently (`unlink`/`rm`) by default. All user-confirmed cleanup operations move files to the native macOS Trash via standard platform APIs.
2. **Mandatory Explicit Confirmation**: No cleanup, uninstall, or duplicate removal occurs automatically or silently. Every operation requires user inspection of paths and sizes.
3. **Strict Path Guardrails**: System volumes, SIP-protected hierarchies, and sensitive user locations are blacklisted at the Rust kernel level. Any operation targeting them is immediately aborted.
4. **Symlink Boundary Integrity**: Traversal and deletion algorithms never follow directory symlinks, preventing infinite recursion loops and out-of-scope filesystem mutations.
5. **Canonicalization Verification**: Paths are canonicalized before validation, defeating directory traversal tricks (`../`, encoded separators, or junction points).
6. **Local-Only Processing**: Zero network telemetry, zero remote error reports, zero cloud syncing. All scans and database records remain strictly on the host Mac.

---

## 2. Protected System Locations (Blacklist)

The Rust deletion engine checks every candidate path against a hardcoded list of protected paths. If a path is identical to or an ancestor/descendant of a protected path (unless explicitly allowlisted within safe sub-caches), the operation is blocked:

```
Protected System Hierarchies:
- /System
- /usr
- /bin
- /sbin
- /private
- /etc
- /var (except approved user caches)
- /Volumes (root mount directory)
- /Library (except specific subdirectories: e.g. /Library/Caches)
- /Applications (except user-initiated Application Manager uninstallation)
- macOS System volumes and read-only sealed APFS snapshots
```

### Sensitive User Data Protections
Under no circumstances will NOVA target or delete:
- User documents, desktop files, or downloads during "Smart Cleanup" (these are only listed in "Disk Analyzer" and "Large Files" for user-driven triage).
- Browser passwords, saved logins, cookies, web storage, or browsing history.
- Keychain files or cryptographic keys (`~/.ssh`, `~/.gnupg`).
- Time Machine backup snapshots or local snapshots.

---

## 3. Safe Deletion Workflow

Every deletion request follows a strict four-stage pipeline:

```
+----------------------------------------------------------------------------------+
| Stage 1: Path Normalization & Canonicalization                                   |
| - Resolve symlinks to detect true targets                                        |
| - Canonicalize relative path segments and eliminate redundant separators        |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| Stage 2: Blacklist & Guardrail Enforcement                                       |
| - Verify path is within user-approved target scope                               |
| - Reject protected system paths, SIP directories, and root volumes              |
| - Ensure path exists and is writable                                            |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| Stage 3: Itemized User Preview & Confirmation                                    |
| - Calculate exact size and file count                                            |
| - Present itemized path list in UI modal                                         |
| - Require explicit user confirmation ("Move to Trash")                           |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| Stage 4: Native macOS Trash Execution & Audit Log                                |
| - Dispatch file to macOS Trash (`trash-rs` / NSWorkspace API)                    |
| - Verify item has been safely relocated                                          |
| - Generate itemized CleanupReport with succeeded, failed, and skipped items      |
| - Persist audit record in local SQLite database                                  |
+----------------------------------------------------------------------------------+
```

---

## 4. macOS Permissions & TCC Architecture

macOS employs Transparency, Consent, and Control (TCC) to safeguard user privacy. NOVA respects and operates within these boundaries:

### Full Disk Access (FDA)
- **Scanning Capability**: Without Full Disk Access, macOS restricts access to certain user directories such as `~/Library/Mail`, `~/Library/Messages`, and Safari data.
- **Graceful Degradation**: NOVA starts in standard user space. If an inaccessible directory is encountered, the scanner records a permission notice and continues scanning accessible paths without crashing or blocking.
- **Permission Diagnostics**: NOVA includes a built-in diagnostic tool to test if Full Disk Access is enabled and provides a 1-click shortcut to macOS System Settings > Privacy & Security > Full Disk Access.

### SIP (System Integrity Protection)
NOVA never attempts to circumvent System Integrity Protection or execute privileged helper scripts requiring root escalations for standard cleanup operations.

---

## 5. Duplicate Detection Security

To prevent catastrophic false positives when detecting duplicate files:
1. Files of identical size are first hashed on their initial 4,096-byte chunk.
2. Only candidates matching the partial hash are fully hashed using cryptographic digests (**BLAKE3** or **SHA-256**).
3. Files are marked duplicates **only** when both byte size and full content digest match.
4. NOVA never automatically removes duplicates; it flags the newest/oldest copy as a recommendation, requiring explicit user selection.

