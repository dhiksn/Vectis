from typing import List
from fastapi import APIRouter, Depends, Query
from agent.app.models.schemas import SystemSnapshot, MetricHistoryPoint, UserInfo
from agent.app.security.auth import get_current_user
from agent.app.websocket.manager import capture_snapshot
from agent.app.database.db import get_recent_metrics_history

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])


@router.get("/current", response_model=SystemSnapshot)
async def get_current_metrics(current_user: UserInfo = Depends(get_current_user)):
    return capture_snapshot()


@router.get("/history", response_model=List[MetricHistoryPoint])
async def get_metrics_history(
    limit: int = Query(default=60, ge=10, le=500),
    current_user: UserInfo = Depends(get_current_user)
):
    return await get_recent_metrics_history(limit=limit)
