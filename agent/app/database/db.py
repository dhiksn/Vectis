import aiosqlite
import time
from typing import List, Optional
from datetime import datetime, timezone
from agent.app.config import settings
from agent.app.models.schemas import MetricHistoryPoint, AuditLogEntry, SystemSnapshot

DB_PATH = settings.DATABASE_PATH


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS metrics_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                iso_time TEXT NOT NULL,
                cpu_percent REAL NOT NULL,
                memory_percent REAL NOT NULL,
                disk_percent REAL NOT NULL,
                net_rx_bps REAL NOT NULL,
                net_tx_bps REAL NOT NULL
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics_history (timestamp)")

        await db.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                username TEXT NOT NULL,
                service_name TEXT NOT NULL,
                action TEXT NOT NULL,
                success INTEGER NOT NULL,
                details TEXT,
                ip_address TEXT
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_logs (id DESC)")

        await db.execute("""
            CREATE TABLE IF NOT EXISTS app_kv (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at REAL NOT NULL
            )
        """)
        await db.commit()


async def record_metric_snapshot(snapshot: SystemSnapshot):
    now_ts = snapshot.timestamp
    iso_time = snapshot.iso_time
    cpu = snapshot.cpu.usage_percent
    mem = snapshot.memory.usage_percent
    disk = snapshot.disk.usage_percent
    rx = snapshot.network.download_speed_bps
    tx = snapshot.network.upload_speed_bps

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO metrics_history 
            (timestamp, iso_time, cpu_percent, memory_percent, disk_percent, net_rx_bps, net_tx_bps)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (now_ts, iso_time, cpu, mem, disk, rx, tx)
        )
        await db.commit()


async def prune_old_metrics(retention_hours: Optional[int] = None):
    hours = retention_hours or settings.DATA_RETENTION_HOURS
    cutoff_ts = time.time() - (hours * 3600)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM metrics_history WHERE timestamp < ?", (cutoff_ts,))
        await db.commit()


async def get_recent_metrics_history(limit: int = 60) -> List[MetricHistoryPoint]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT timestamp, iso_time, cpu_percent, memory_percent, disk_percent, net_rx_bps, net_tx_bps
            FROM metrics_history
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = await cursor.fetchall()
        # Return in ascending order for charting
        result = [
            MetricHistoryPoint(
                timestamp=row["timestamp"],
                iso_time=row["iso_time"],
                cpu_percent=row["cpu_percent"],
                memory_percent=row["memory_percent"],
                disk_percent=row["disk_percent"],
                net_rx_bps=row["net_rx_bps"],
                net_tx_bps=row["net_tx_bps"]
            )
            for row in reversed(rows)
        ]
        return result


async def record_audit_log(
    username: str,
    service_name: str,
    action: str,
    success: bool,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    iso_now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO audit_logs (timestamp, username, service_name, action, success, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (iso_now, username, service_name, action, 1 if success else 0, details, ip_address)
        )
        await db.commit()


async def get_audit_logs(limit: int = 50) -> List[AuditLogEntry]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT id, timestamp, username, service_name, action, success, details, ip_address
            FROM audit_logs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = await cursor.fetchall()
        return [
            AuditLogEntry(
                id=row["id"],
                timestamp=row["timestamp"],
                username=row["username"],
                service_name=row["service_name"],
                action=row["action"],
                success=bool(row["success"]),
                details=row["details"],
                ip_address=row["ip_address"]
            )
            for row in rows
        ]
