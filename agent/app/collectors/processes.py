from typing import List, Optional
import psutil
from agent.app.models.schemas import ProcessMetrics


def get_processes(
    sort_by: str = "cpu",
    limit: int = 50,
    search: Optional[str] = None
) -> List[ProcessMetrics]:
    procs: List[ProcessMetrics] = []

    for p in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'memory_info', 'status', 'num_threads']):
        try:
            info = p.info
            name = info.get('name') or "unknown"
            if search and search.lower() not in name.lower():
                continue

            mem_info = info.get('memory_info')
            rss = mem_info.rss if mem_info else 0

            procs.append(
                ProcessMetrics(
                    pid=info.get('pid', 0),
                    name=name,
                    username=info.get('username') or "system",
                    cpu_percent=round(info.get('cpu_percent') or 0.0, 1),
                    memory_percent=round(info.get('memory_percent') or 0.0, 1),
                    memory_rss_bytes=rss,
                    status=info.get('status') or "running",
                    num_threads=info.get('num_threads') or 1
                )
            )
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    if sort_by == "memory":
        procs.sort(key=lambda x: x.memory_percent, reverse=True)
    elif sort_by == "name":
        procs.sort(key=lambda x: x.name.lower())
    else:  # default cpu
        procs.sort(key=lambda x: x.cpu_percent, reverse=True)

    return procs[:limit]
