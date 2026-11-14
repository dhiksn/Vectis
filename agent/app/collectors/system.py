import os
import sys
import platform
import socket
import time
import psutil
from agent.app.models.schemas import SystemMetrics


def _read_os_release() -> str:
    """Read Linux /etc/os-release or accurate Windows 10/11 version"""
    # 1. Linux / Debian
    if os.path.exists("/etc/os-release"):
        try:
            with open("/etc/os-release", "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        return line.strip().split("=", 1)[1].strip('"\'')
        except Exception:
            pass

    # 2. Windows 10 vs Windows 11 distinction
    # Microsoft kept the NT major version as 10.0 for both Windows 10 and 11.
    # Windows 11 builds start from 22000+.
    if platform.system() == "Windows":
        try:
            win_ver = sys.getwindowsversion()
            build = getattr(win_ver, "build", 0)
            edition = "Windows 11" if build >= 22000 else "Windows 10"
            return f"{edition} (Build {build})"
        except Exception:
            pass

    return f"{platform.system()} {platform.release()}"


def get_system_metrics() -> SystemMetrics:
    boot_time = psutil.boot_time()
    uptime_seconds = max(0.0, time.time() - boot_time)

    # Load averages: psutil.getloadavg() returns (1m, 5m, 15m) on UNIX
    try:
        load1, load5, load15 = psutil.getloadavg()
    except (AttributeError, OSError):
        # Fallback on platforms without getloadavg (e.g. Windows dev)
        # Approximate using current CPU usage
        cpu = psutil.cpu_percent(interval=None) / 100.0 * (psutil.cpu_count() or 1)
        load1, load5, load15 = round(cpu, 2), round(cpu, 2), round(cpu, 2)

    os_pretty = _read_os_release()

    if platform.system() == "Windows":
        kernel = f"NT {platform.version()}"
    else:
        kernel = platform.release() or platform.version()

    return SystemMetrics(
        hostname=socket.gethostname(),
        os_name=platform.system(),
        os_version=os_pretty,
        kernel_version=kernel,
        architecture=platform.machine(),
        uptime_seconds=round(uptime_seconds, 1),
        load_avg_1m=round(load1, 2),
        load_avg_5m=round(load5, 2),
        load_avg_15m=round(load15, 2),
        boot_time=boot_time
    )
