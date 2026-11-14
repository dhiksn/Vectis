from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from agent.app.models.schemas import (
    ServiceInfo,
    ServiceActionRequest,
    ServiceActionResponse,
    AuditLogEntry,
    UserInfo
)
from agent.app.security.auth import get_current_user
from agent.app.collectors.services import (
    get_services_list,
    get_single_service_info,
    execute_service_action,
    is_service_name_valid,
    is_service_allowlisted
)
from agent.app.database.db import record_audit_log, get_audit_logs

router = APIRouter(prefix="/api/services", tags=["Services"])


@router.get("", response_model=List[ServiceInfo])
async def list_services(
    search: Optional[str] = Query(default=None),
    current_user: UserInfo = Depends(get_current_user)
):
    return get_services_list(search=search)


@router.get("/audit-logs", response_model=List[AuditLogEntry])
async def list_audit_logs(
    limit: int = Query(default=50, ge=5, le=200),
    current_user: UserInfo = Depends(get_current_user)
):
    return await get_audit_logs(limit=limit)


@router.get("/{service_name}", response_model=ServiceInfo)
async def get_service(
    service_name: str,
    current_user: UserInfo = Depends(get_current_user)
):
    if not is_service_name_valid(service_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid service name format: {service_name}"
        )
    return get_single_service_info(service_name)


@router.post("/{service_name}/action", response_model=ServiceActionResponse)
async def trigger_service_action(
    service_name: str,
    body: ServiceActionRequest,
    request: Request,
    current_user: UserInfo = Depends(get_current_user)
):
    action = body.action.lower().strip()
    target_service = service_name.lower().strip()

    # Security check 1: service name syntax
    if not is_service_name_valid(target_service):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service name format. Only alphanumeric, dashes, dots, and underscores allowed."
        )

    # Security check 2: server-side allowlist check
    if not is_service_allowlisted(target_service):
        client_ip = request.client.host if request.client else "unknown"
        await record_audit_log(
            username=current_user.username,
            service_name=target_service,
            action=action,
            success=False,
            details="Rejected: Service not in server allowlist",
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Service '{target_service}' is not in the server allowlist."
        )

    # Security check 3: action check
    if action not in ("start", "stop", "restart"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{action}'. Permitted: start, stop, restart"
        )

    # Execute action safely via privileged helper or systemctl
    success, message, details = execute_service_action(action, target_service)

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    await record_audit_log(
        username=current_user.username,
        service_name=target_service,
        action=action,
        success=success,
        details=details or message,
        ip_address=client_ip
    )

    if not success:
        return ServiceActionResponse(
            success=False,
            action=action,
            service_name=target_service,
            message=message,
            details=details
        )

    return ServiceActionResponse(
        success=True,
        action=action,
        service_name=target_service,
        message=message,
        details=details
    )
