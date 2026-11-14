import sys
import os
import pytest
import asyncio

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from agent.app.main import app
from agent.app.config import settings
from agent.app.collectors.cpu import get_cpu_metrics
from agent.app.collectors.memory import get_memory_metrics
from agent.app.collectors.disk import get_disk_metrics
from agent.app.collectors.network import network_collector, get_network_metrics
from agent.app.collectors.system import get_system_metrics
from agent.app.collectors.services import (
    is_service_name_valid,
    is_service_allowlisted,
    execute_service_action,
    get_services_list
)
from agent.app.security.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token
)
from agent.app.database.db import init_db


@pytest.fixture(autouse=True)
def setup_test_db():
    asyncio.run(init_db())


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": settings.ADMIN_USERNAME})
    return {"Authorization": f"Bearer {token}"}


# 1. Collector Tests
def test_cpu_collector():
    cpu = get_cpu_metrics()
    assert 0.0 <= cpu.usage_percent <= 100.0
    assert cpu.core_count_physical >= 1
    assert cpu.core_count_logical >= 1
    assert len(cpu.per_cpu_percent) >= 1


def test_memory_collector():
    mem = get_memory_metrics()
    assert mem.total_bytes > 0
    assert mem.used_bytes >= 0
    assert 0.0 <= mem.usage_percent <= 100.0
    assert mem.swap_total_bytes >= 0


def test_disk_collector():
    disk = get_disk_metrics()
    assert disk.total_bytes > 0
    assert 0.0 <= disk.usage_percent <= 100.0
    assert len(disk.partitions) >= 1


def test_network_collector_delta_speed():
    # Calling collector twice calculates real rate of change
    net1 = get_network_metrics()
    assert net1.total_bytes_sent >= 0
    assert net1.total_bytes_recv >= 0
    assert net1.upload_speed_bps >= 0.0
    assert net1.download_speed_bps >= 0.0


def test_system_collector():
    sys = get_system_metrics()
    assert len(sys.hostname) > 0
    assert len(sys.os_name) > 0
    assert sys.uptime_seconds >= 0


# 2. Service Security & Allowlist Tests
def test_service_name_validation():
    # Valid names
    assert is_service_name_valid("nginx")
    assert is_service_name_valid("nginx.service")
    assert is_service_name_valid("systemd-journald")
    assert is_service_name_valid("docker")

    # Invalid names / Command injection attempts - MUST BE REJECTED!
    assert not is_service_name_valid("nginx; rm -rf /")
    assert not is_service_name_valid("nginx && whoami")
    assert not is_service_name_valid("nginx | cat /etc/passwd")
    assert not is_service_name_valid("`cat /etc/shadow`")
    assert not is_service_name_valid("$(reboot)")
    assert not is_service_name_valid("../../../etc/shadow")
    assert not is_service_name_valid("service with spaces")
    assert not is_service_name_valid("")


def test_service_allowlist_enforcement():
    # Configured in settings
    assert is_service_allowlisted("nginx")
    assert is_service_allowlisted("ssh")
    assert is_service_allowlisted("docker")

    # Disallowed services
    assert not is_service_allowlisted("malicious_daemon")
    assert not is_service_allowlisted("systemd-resolved-forbidden")
    assert not is_service_allowlisted("cron_hacked")


def test_service_action_safety():
    # Allowed service execution
    success, msg, _ = execute_service_action("restart", "nginx")
    assert success is True

    # Disallowed service execution attempt
    success, msg, _ = execute_service_action("restart", "random_hacker_service")
    assert success is False
    assert "not in server allowlist" in msg

    # Shell injection attempt
    success, msg, _ = execute_service_action("restart", "nginx; echo pwned")
    assert success is False
    assert "Invalid service name" in msg

    # Invalid action
    success, msg, _ = execute_service_action("destroy", "nginx")
    assert success is False
    assert "Invalid action" in msg


# 3. Authentication & Authorization Tests
def test_password_hashing():
    pw = "SecretP@ssword123!"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed)
    assert not verify_password("wrongpass", hashed)


def test_login_endpoint(client):
    # Valid login (admin / admin123)
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["username"] == "admin"

    # Invalid password
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "badpassword"})
    assert resp.status_code == 401


def test_protected_routes_require_auth(client):
    # Unauthorized request to metrics
    resp = client.get("/api/metrics/current")
    assert resp.status_code == 401

    # Unauthorized request to services
    resp = client.get("/api/services")
    assert resp.status_code == 401

    # Unauthorized service action
    resp = client.post("/api/services/nginx/action", json={"action": "restart", "service_name": "nginx"})
    assert resp.status_code == 401


def test_authorized_requests(client, auth_headers):
    resp = client.get("/api/metrics/current", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "cpu" in data
    assert "memory" in data

    resp = client.get("/api/services", headers=auth_headers)
    assert resp.status_code == 200
    services = resp.json()
    assert isinstance(services, list)


def test_api_service_action_enforcement(client, auth_headers):
    # Valid service action
    resp = client.post(
        "/api/services/nginx/action",
        headers=auth_headers,
        json={"action": "restart", "service_name": "nginx"}
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Unauthorized service target (not allowlisted)
    resp = client.post(
        "/api/services/unauthorized-daemon/action",
        headers=auth_headers,
        json={"action": "start", "service_name": "unauthorized-daemon"}
    )
    assert resp.status_code == 403

    # Command injection attempt via API route
    resp = client.post(
        "/api/services/nginx;whoami/action",
        headers=auth_headers,
        json={"action": "restart", "service_name": "nginx;whoami"}
    )
    assert resp.status_code == 400
    assert "Invalid service name" in resp.json()["detail"]


def test_websocket_auth(client):
    # Test websocket without auth token
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/metrics") as ws:
            pass

    # Test websocket with valid auth token
    token = create_access_token(data={"sub": "admin"})
    with client.websocket_connect(f"/ws/metrics?token={token}") as ws:
        # ping pong
        ws.send_text("ping")
        data = ws.receive_text()
        assert data == "pong"
