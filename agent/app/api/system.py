from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from agent.app.models.schemas import SystemMetrics, DiskMetrics, NetworkMetrics, UserInfo
from agent.app.security.auth import get_current_user
from agent.app.collectors.system import get_system_metrics
from agent.app.collectors.disk import get_disk_metrics
from agent.app.collectors.network import get_network_metrics
from agent.app.config import settings

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/info", response_model=SystemMetrics)
async def get_system_info(current_user: UserInfo = Depends(get_current_user)):
    return get_system_metrics()


@router.get("/storage", response_model=DiskMetrics)
async def get_storage_info(current_user: UserInfo = Depends(get_current_user)):
    return get_disk_metrics()


@router.get("/network", response_model=NetworkMetrics)
async def get_network_info(current_user: UserInfo = Depends(get_current_user)):
    return get_network_metrics()


@router.get("/config")
async def get_server_config(current_user: UserInfo = Depends(get_current_user)) -> Dict[str, Any]:
    return {
        "metrics_interval_seconds": settings.METRICS_INTERVAL,
        "service_allowlist": sorted(list(settings.service_allowlist_set)),
        "data_retention_hours": settings.DATA_RETENTION_HOURS,
        "agent_host": settings.AGENT_HOST,
        "agent_port": settings.AGENT_PORT
    }
