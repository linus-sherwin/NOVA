use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scanned_at TEXT NOT NULL,
            target_path TEXT NOT NULL,
            total_bytes INTEGER NOT NULL,
            file_count INTEGER NOT NULL,
            directory_count INTEGER NOT NULL,
            elapsed_secs REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cleanup_audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            executed_at TEXT NOT NULL,
            path TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            success INTEGER NOT NULL,
            error_message TEXT
        );

        CREATE TABLE IF NOT EXISTS storage_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            total_bytes INTEGER NOT NULL,
            used_bytes INTEGER NOT NULL,
            available_bytes INTEGER NOT NULL
        );
        ",
    )?;

    Ok(())
}

