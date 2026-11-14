import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Set
from fastapi import WebSocket

from agent.app.config import settings
from agent.app.models.schemas import SystemSnapshot
from agent.app.collectors.cpu import get_cpu_metrics
from agent.app.collectors.memory import get_memory_metrics
from agent.app.collectors.disk import get_disk_metrics
from agent.app.collectors.network import get_network_metrics
from agent.app.collectors.system import get_system_metrics
from agent.app.database.db import record_metric_snapshot, prune_old_metrics

logger = logging.getLogger(__name__)


def capture_snapshot() -> SystemSnapshot:
    now = time.time()
    iso = datetime.now(timezone.utc).isoformat()
    return SystemSnapshot(
        timestamp=now,
        iso_time=iso,
        cpu=get_cpu_metrics(),
        memory=get_memory_metrics(),
        disk=get_disk_metrics(),
        network=get_network_metrics(),
        system=get_system_metrics()
    )


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._broadcast_task: asyncio.Task = None
        self._running: bool = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_snapshot(self, snapshot: SystemSnapshot):
        if not self.active_connections:
            return

        payload = snapshot.model_dump_json()
        dead_connections = set()

        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.add(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    async def _broadcast_loop(self):
        db_record_counter = 0
        prune_counter = 0

        while self._running:
            try:
                snapshot = capture_snapshot()

                # Broadcast to active frontend subscribers
                if self.active_connections:
                    await self.broadcast_snapshot(snapshot)

                # Persist to database every 3 cycles (e.g. every 9-10s) to keep disk writes minimal on VPS
                db_record_counter += 1
                if db_record_counter >= 3:
                    await record_metric_snapshot(snapshot)
                    db_record_counter = 0

                # Prune database once every 200 cycles (~10 minutes)
                prune_counter += 1
                if prune_counter >= 200:
                    await prune_old_metrics()
                    prune_counter = 0

            except Exception as e:
                logger.error(f"Error in telemetry loop: {e}", exc_info=True)

            await asyncio.sleep(settings.METRICS_INTERVAL)

    def start_broadcasting(self):
        if not self._running:
            self._running = True
            self._broadcast_task = asyncio.create_task(self._broadcast_loop())

    async def stop_broadcasting(self):
        self._running = False
        if self._broadcast_task:
            self._broadcast_task.cancel()
            try:
                await self._broadcast_task
            except asyncio.CancelledError:
                pass


manager = ConnectionManager()
