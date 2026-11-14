from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from agent.app.models.schemas import ProcessMetrics, UserInfo
from agent.app.security.auth import get_current_user
from agent.app.collectors.processes import get_processes

router = APIRouter(prefix="/api/processes", tags=["Processes"])


@router.get("", response_model=List[ProcessMetrics])
async def list_processes(
    sort_by: str = Query(default="cpu", pattern="^(cpu|memory|name)$"),
    limit: int = Query(default=50, ge=5, le=200),
    search: Optional[str] = Query(default=None),
    current_user: UserInfo = Depends(get_current_user)
):
    return get_processes(sort_by=sort_by, limit=limit, search=search)
