import psutil
from typing import List
from agent.app.models.schemas import DiskMetrics, DiskPartition


def get_disk_metrics() -> DiskMetrics:
    partitions_data: List[DiskPartition] = []
    total_agg = 0
    used_agg = 0
    free_agg = 0
    seen_devices = set()

    try:
        partitions = psutil.disk_partitions(all=False)
    except Exception:
        partitions = []

    for part in partitions:
        # Avoid duplicate counting of filesystem devices (e.g. bind mounts)
        if part.device in seen_devices and part.fstype in ('', 'squashfs'):
            continue

        try:
            usage = psutil.disk_usage(part.mountpoint)
            partitions_data.append(
                DiskPartition(
                    device=part.device,
                    mountpoint=part.mountpoint,
                    fstype=part.fstype,
                    total_bytes=usage.total,
                    used_bytes=usage.used,
                    free_bytes=usage.free,
                    percent=round(usage.percent, 1)
                )
            )
            # Only aggregate physical drives once
            if part.device not in seen_devices:
                total_agg += usage.total
                used_agg += usage.used
                free_agg += usage.free
                seen_devices.add(part.device)
        except (PermissionError, OSError):
            # Inaccessible or protected mount points are skipped safely
            continue

    # Fallback to root if empty
    if not partitions_data:
        try:
            root_usage = psutil.disk_usage("/")
            total_agg = root_usage.total
            used_agg = root_usage.used
            free_agg = root_usage.free
            partitions_data.append(
                DiskPartition(
                    device="rootfs",
                    mountpoint="/",
                    fstype="ext4",
                    total_bytes=root_usage.total,
                    used_bytes=root_usage.used,
                    free_bytes=root_usage.free,
                    percent=round(root_usage.percent, 1)
                )
            )
        except Exception:
            pass

    usage_percent = round((used_agg / total_agg * 100), 1) if total_agg > 0 else 0.0

    return DiskMetrics(
        total_bytes=total_agg,
        used_bytes=used_agg,
        free_bytes=free_agg,
        usage_percent=usage_percent,
        partitions=partitions_data
    )
