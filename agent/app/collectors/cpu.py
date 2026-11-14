import psutil
from agent.app.models.schemas import CPUMetrics

# Initialize psutil cpu percent measurement so first call is non-blocking
psutil.cpu_percent(interval=None)
psutil.cpu_percent(interval=None, percpu=True)


def get_cpu_metrics() -> CPUMetrics:
    usage_percent = float(psutil.cpu_percent(interval=None))
    per_cpu = [float(p) for p in psutil.cpu_percent(interval=None, percpu=True)]
    physical_cores = psutil.cpu_count(logical=False) or 1
    logical_cores = psutil.cpu_count(logical=True) or 1

    freq_current = None
    freq_min = None
    freq_max = None
    try:
        freq = psutil.cpu_freq()
        if freq:
            freq_current = round(freq.current, 2)
            if hasattr(freq, 'min') and freq.min:
                freq_min = round(freq.min, 2)
            if hasattr(freq, 'max') and freq.max:
                freq_max = round(freq.max, 2)
    except Exception:
        pass

    return CPUMetrics(
        usage_percent=round(usage_percent, 1),
        core_count_physical=physical_cores,
        core_count_logical=logical_cores,
        frequency_current=freq_current,
        frequency_min=freq_min,
        frequency_max=freq_max,
        per_cpu_percent=per_cpu
    )
