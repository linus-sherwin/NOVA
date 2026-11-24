use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use super::migrations::run_migrations;
use super::models::{ScanRecord, StorageTrendPoint};

pub struct Database {
    db_path: PathBuf,
}

impl Database {
    pub fn new() -> Result<Self> {
        let app_data = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("com.nova.storage");

        std::fs::create_dir_all(&app_data).ok();
        let db_path = app_data.join("nova.db");

        let conn = Connection::open(&db_path)?;
        run_migrations(&conn)?;

        Ok(Self { db_path })
    }

    fn get_connection(&self) -> Result<Connection> {
        Connection::open(&self.db_path)
    }

    pub fn insert_scan(
        &self,
        target_path: &str,
        total_bytes: u64,
        file_count: usize,
        directory_count: usize,
        elapsed_secs: f64,
    ) -> Result<i64> {
        let conn = self.get_connection()?;
        let now = chrono::Local::now().to_rfc3339();

        conn.execute(
            "INSERT INTO scan_history (scanned_at, target_path, total_bytes, file_count, directory_count, elapsed_secs)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![now, target_path, total_bytes as i64, file_count as i64, directory_count as i64, elapsed_secs],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn list_scans(&self, limit: usize) -> Result<Vec<ScanRecord>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, scanned_at, target_path, total_bytes, file_count, directory_count, elapsed_secs
             FROM scan_history
             ORDER BY id DESC
             LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok(ScanRecord {
                id: row.get(0)?,
                scanned_at: row.get(1)?,
                target_path: row.get(2)?,
                total_bytes: row.get::<_, i64>(3)? as u64,
                file_count: row.get::<_, i64>(4)? as usize,
                directory_count: row.get::<_, i64>(5)? as usize,
                elapsed_secs: row.get(6)?,
            })
        })?;

        let mut results = Vec::new();
        for r in rows {
            if let Ok(record) = r {
                results.push(record);
            }
        }
        Ok(results)
    }

    pub fn record_storage_snapshot(&self, total: u64, used: u64, available: u64) -> Result<()> {
        let conn = self.get_connection()?;
        let now = chrono::Local::now().format("%Y-%m-%d %H:%M").to_string();

        conn.execute(
            "INSERT INTO storage_snapshots (timestamp, total_bytes, used_bytes, available_bytes)
             VALUES (?1, ?2, ?3, ?4)",
            params![now, total as i64, used as i64, available as i64],
        )?;

        Ok(())
    }

    pub fn get_storage_trends(&self) -> Result<Vec<StorageTrendPoint>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT timestamp, total_bytes, used_bytes, available_bytes
             FROM storage_snapshots
             ORDER BY id DESC
             LIMIT 14",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(StorageTrendPoint {
                date: row.get(0)?,
                total_bytes: row.get::<_, i64>(1)? as u64,
                used_bytes: row.get::<_, i64>(2)? as u64,
                available_bytes: row.get::<_, i64>(3)? as u64,
            })
        })?;

        let mut results = Vec::new();
        for r in rows {
            if let Ok(point) = r {
                results.push(point);
            }
        }
        results.reverse();
        Ok(results)
    }
}

