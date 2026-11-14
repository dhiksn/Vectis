import time
import psutil
from typing import Optional, Dict
from agent.app.models.schemas import NetworkMetrics, NetworkInterfaceMetrics


class NetworkCollector:
    def __init__(self):
        self._last_sample_time: Optional[float] = None
        self._last_bytes_sent: int = 0
        self._last_bytes_recv: int = 0
        self._upload_speed_bps: float = 0.0
        self._download_speed_bps: float = 0.0

        # Prime initial counter
        self._sample_initial()

    def _sample_initial(self):
        try:
            totals = psutil.net_io_counters()
            if totals:
                self._last_bytes_sent = totals.bytes_sent
                self._last_bytes_recv = totals.bytes_recv
                self._last_sample_time = time.time()
        except Exception:
            pass

    def get_metrics(self) -> NetworkMetrics:
        now = time.time()
        try:
            totals = psutil.net_io_counters()
            bytes_sent = totals.bytes_sent if totals else 0
            bytes_recv = totals.bytes_recv if totals else 0
        except Exception:
            bytes_sent = 0
            bytes_recv = 0

        # Calculate delta speed if we have a previous sample
        if self._last_sample_time is not None:
            time_delta = now - self._last_sample_time
            if time_delta > 0.1:  # at least 100ms delta to avoid division spikes
                delta_sent = max(0, bytes_sent - self._last_bytes_sent)
                delta_recv = max(0, bytes_recv - self._last_bytes_recv)

                self._upload_speed_bps = round(delta_sent / time_delta, 1)
                self._download_speed_bps = round(delta_recv / time_delta, 1)

                self._last_bytes_sent = bytes_sent
                self._last_bytes_recv = bytes_recv
                self._last_sample_time = now
        else:
            self._last_sample_time = now
            self._last_bytes_sent = bytes_sent
            self._last_bytes_recv = bytes_recv

        # Collect per-interface metrics
        interfaces_list = []
        try:
            per_nic = psutil.net_io_counters(pernic=True)
            nic_stats = psutil.net_if_stats()
            for nic_name, nic_io in per_nic.items():
                is_up = nic_stats[nic_name].isup if nic_name in nic_stats else True
                interfaces_list.append(
                    NetworkInterfaceMetrics(
                        name=nic_name,
                        bytes_sent=nic_io.bytes_sent,
                        bytes_recv=nic_io.bytes_recv,
                        packets_sent=nic_io.packets_sent,
                        packets_recv=nic_io.packets_recv,
                        is_up=is_up
                    )
                )
        except Exception:
            pass

        return NetworkMetrics(
            upload_speed_bps=self._upload_speed_bps,
            download_speed_bps=self._download_speed_bps,
            total_bytes_sent=bytes_sent,
            total_bytes_recv=bytes_recv,
            interfaces=interfaces_list
        )


network_collector = NetworkCollector()


def get_network_metrics() -> NetworkMetrics:
    return network_collector.get_metrics()
