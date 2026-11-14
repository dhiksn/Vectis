from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    username: str
    is_admin: bool = True


class CPUMetrics(BaseModel):
    usage_percent: float
    core_count_physical: int
    core_count_logical: int
    frequency_current: Optional[float] = None
    frequency_min: Optional[float] = None
    frequency_max: Optional[float] = None
    per_cpu_percent: List[float] = Field(default_factory=list)


class MemoryMetrics(BaseModel):
    total_bytes: int
    used_bytes: int
    available_bytes: int
    usage_percent: float
    swap_total_bytes: int
    swap_used_bytes: int
    swap_percent: float


class DiskPartition(BaseModel):
    device: str
    mountpoint: str
    fstype: str
    total_bytes: int
    used_bytes: int
    free_bytes: int
    percent: float


class DiskMetrics(BaseModel):
    total_bytes: int
    used_bytes: int
    free_bytes: int
    usage_percent: float
    partitions: List[DiskPartition] = Field(default_factory=list)


class NetworkInterfaceMetrics(BaseModel):
    name: str
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    is_up: bool


class NetworkMetrics(BaseModel):
    upload_speed_bps: float  # Bytes per second
    download_speed_bps: float  # Bytes per second
    total_bytes_sent: int
    total_bytes_recv: int
    interfaces: List[NetworkInterfaceMetrics] = Field(default_factory=list)


class SystemMetrics(BaseModel):
    hostname: str
    os_name: str
    os_version: str
    kernel_version: str
    architecture: str
    uptime_seconds: float
    load_avg_1m: float
    load_avg_5m: float
    load_avg_15m: float
    boot_time: float


class ProcessMetrics(BaseModel):
    pid: int
    name: str
    username: Optional[str] = "unknown"
    cpu_percent: float
    memory_percent: float
    memory_rss_bytes: int
    status: str
    num_threads: Optional[int] = 1


class ServiceInfo(BaseModel):
    name: str
    description: str
    active_state: str  # active, inactive, failed, etc.
    sub_state: str  # running, dead, exited, etc.
    load_state: str  # loaded, not-found, etc.
    status: str  # "running", "stopped", "failed", "unknown"
    is_active: bool
    is_enabled: Optional[bool] = None
    allowlisted: bool = True


class ServiceActionRequest(BaseModel):
    action: str = Field(..., pattern="^(start|stop|restart)$")
    service_name: str = Field(..., min_length=1, max_length=128)


class ServiceActionResponse(BaseModel):
    success: bool
    action: str
    service_name: str
    message: str
    details: Optional[str] = None


class AuditLogEntry(BaseModel):
    id: Optional[int] = None
    timestamp: str
    username: str
    service_name: str
    action: str
    success: bool
    details: Optional[str] = None
    ip_address: Optional[str] = None


class SystemSnapshot(BaseModel):
    timestamp: float
    iso_time: str
    cpu: CPUMetrics
    memory: MemoryMetrics
    disk: DiskMetrics
    network: NetworkMetrics
    system: SystemMetrics


class MetricHistoryPoint(BaseModel):
    timestamp: float
    iso_time: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    net_rx_bps: float
    net_tx_bps: float
