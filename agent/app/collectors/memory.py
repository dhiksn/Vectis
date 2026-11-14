import psutil
from agent.app.models.schemas import MemoryMetrics


def get_memory_metrics() -> MemoryMetrics:
    vm = psutil.virtual_memory()
    sm = psutil.swap_memory()

    return MemoryMetrics(
        total_bytes=vm.total,
        used_bytes=vm.used,
        available_bytes=vm.available,
        usage_percent=round(vm.percent, 1),
        swap_total_bytes=sm.total,
        swap_used_bytes=sm.used,
        swap_percent=round(sm.percent, 1)
    )
