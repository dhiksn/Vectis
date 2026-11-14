import os
import re
import shutil
import subprocess
from typing import List, Dict, Optional, Tuple
from agent.app.config import settings
from agent.app.models.schemas import ServiceInfo, ServiceActionResponse

SERVICE_NAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]+(@[a-zA-Z0-9_\-\.]*)?(\.service)?$")
VALID_ACTIONS = {"start", "stop", "restart", "status"}
HELPER_PATH = "/usr/local/bin/vps-service-helper"

# In-memory mock states for non-Linux / test environments
_DEV_SERVICE_STATES: Dict[str, Dict[str, str]] = {
    "nginx": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "A high performance web server and reverse proxy server"},
    "ssh": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "OpenBSD Secure Shell server"},
    "sshd": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "OpenSSH server daemon"},
    "docker": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "Docker Application Container Engine"},
    "cron": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "Regular background program processing daemon"},
    "ufw": {"status": "running", "active_state": "active", "sub_state": "exited", "is_enabled": True, "description": "Uncomplicated firewall"},
    "mysql": {"status": "stopped", "active_state": "inactive", "sub_state": "dead", "is_enabled": False, "description": "MySQL Community Server"},
    "postgresql": {"status": "stopped", "active_state": "inactive", "sub_state": "dead", "is_enabled": False, "description": "PostgreSQL RDBMS server"},
    "ollama": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "Ollama LLM Runner Service"},
    "redis": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "Advanced key-value store"},
    "systemd-journald": {"status": "running", "active_state": "active", "sub_state": "running", "is_enabled": True, "description": "Journal Service"},
}


def sanitize_service_name(name: str) -> str:
    cleaned = name.strip()
    return cleaned


def is_service_name_valid(name: str) -> bool:
    if not name or len(name) > 128:
        return False
    return bool(SERVICE_NAME_REGEX.match(name))


def is_service_allowlisted(name: str) -> bool:
    normalized = name.lower()
    if normalized.endswith(".service"):
        normalized = normalized[:-8]
    return normalized in settings.service_allowlist_set


def has_systemctl() -> bool:
    return shutil.which("systemctl") is not None


def get_single_service_info(service_name: str) -> ServiceInfo:
    norm_name = service_name.lower()
    base_name = norm_name[:-8] if norm_name.endswith(".service") else norm_name
    unit_name = f"{base_name}.service"

    allowlisted = is_service_allowlisted(base_name)

    if not has_systemctl():
        # Dev / fallback environment
        mock = _DEV_SERVICE_STATES.get(base_name, {
            "status": "stopped",
            "active_state": "inactive",
            "sub_state": "dead",
            "is_enabled": False,
            "description": f"{base_name} service"
        })
        return ServiceInfo(
            name=base_name,
            description=mock.get("description", f"{base_name} service"),
            active_state=mock["active_state"],
            sub_state=mock["sub_state"],
            load_state="loaded",
            status=mock["status"],
            is_active=(mock["active_state"] == "active"),
            is_enabled=mock["is_enabled"],
            allowlisted=allowlisted
        )

    # Real systemctl query
    try:
        proc = subprocess.run(
            ["systemctl", "show", unit_name, "--property=Id,Description,ActiveState,SubState,LoadState,UnitFileState"],
            capture_output=True,
            text=True,
            check=False,
            timeout=5
        )
        props: Dict[str, str] = {}
        for line in proc.stdout.splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                props[k.strip()] = v.strip()

        active_state = props.get("ActiveState", "unknown")
        sub_state = props.get("SubState", "unknown")
        load_state = props.get("LoadState", "unknown")
        description = props.get("Description") or f"{base_name} service"
        unit_file_state = props.get("UnitFileState", "disabled")
        is_enabled = (unit_file_state == "enabled")

        status = "unknown"
        if active_state == "active":
            status = "running"
        elif active_state == "failed":
            status = "failed"
        elif active_state in ("inactive", "dead"):
            status = "stopped"

        return ServiceInfo(
            name=base_name,
            description=description,
            active_state=active_state,
            sub_state=sub_state,
            load_state=load_state,
            status=status,
            is_active=(active_state == "active"),
            is_enabled=is_enabled,
            allowlisted=allowlisted
        )
    except Exception as e:
        return ServiceInfo(
            name=base_name,
            description=f"{base_name} service",
            active_state="unknown",
            sub_state="unknown",
            load_state="not-found",
            status="unknown",
            is_active=False,
            is_enabled=False,
            allowlisted=allowlisted
        )


def get_services_list(search: Optional[str] = None) -> List[ServiceInfo]:
    services: List[ServiceInfo] = []
    # Collect all configured allowlisted services
    for s_name in sorted(settings.service_allowlist_set):
        if search and search.lower() not in s_name.lower():
            continue
        info = get_single_service_info(s_name)
        services.append(info)
    return services


def execute_service_action(action: str, service_name: str) -> Tuple[bool, str, Optional[str]]:
    """
    Executes service action with strict validation:
    1. Validates action
    2. Validates regex
    3. Validates allowlist
    4. Runs safe subprocess (NO shell=True) via helper or systemctl
    """
    action = action.strip().lower()
    if action not in VALID_ACTIONS:
        return False, f"Invalid action: {action}", None

    if not is_service_name_valid(service_name):
        return False, f"Invalid service name syntax: {service_name}", None

    norm_name = service_name.lower()
    base_name = norm_name[:-8] if norm_name.endswith(".service") else norm_name
    unit_name = f"{base_name}.service"

    if not is_service_allowlisted(base_name):
        return False, f"Service '{base_name}' is not in server allowlist", None

    # Check for Linux systemctl
    if not has_systemctl():
        # Dev / non-Linux simulation
        if base_name in _DEV_SERVICE_STATES:
            if action == "start":
                _DEV_SERVICE_STATES[base_name]["status"] = "running"
                _DEV_SERVICE_STATES[base_name]["active_state"] = "active"
                _DEV_SERVICE_STATES[base_name]["sub_state"] = "running"
            elif action == "stop":
                _DEV_SERVICE_STATES[base_name]["status"] = "stopped"
                _DEV_SERVICE_STATES[base_name]["active_state"] = "inactive"
                _DEV_SERVICE_STATES[base_name]["sub_state"] = "dead"
            elif action == "restart":
                _DEV_SERVICE_STATES[base_name]["status"] = "running"
                _DEV_SERVICE_STATES[base_name]["active_state"] = "active"
                _DEV_SERVICE_STATES[base_name]["sub_state"] = "running"
        return True, f"Service {base_name} {action}ed successfully (dev environment)", None

    # Real execution
    cmd: List[str]
    if os.path.exists(HELPER_PATH) and os.access(HELPER_PATH, os.X_OK):
        cmd = ["sudo", HELPER_PATH, action, unit_name]
    else:
        # Fallback to direct systemctl
        cmd = ["systemctl", action, unit_name]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=15
        )
        if proc.returncode == 0:
            return True, f"Service {base_name} {action}ed successfully", proc.stdout.strip()
        else:
            err = proc.stderr.strip() or proc.stdout.strip() or f"Process exited with code {proc.returncode}"
            return False, f"Failed to {action} {base_name}", err
    except subprocess.TimeoutExpired:
        return False, f"Timed out waiting for {action} on {base_name}", None
    except Exception as e:
        return False, f"Execution error for {base_name}: {str(e)}", str(e)
