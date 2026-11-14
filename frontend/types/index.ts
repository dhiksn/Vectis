export interface CPUMetrics {
  usage_percent: number;
  core_count_physical: number;
  core_count_logical: number;
  frequency_current?: number | null;
  frequency_min?: number | null;
  frequency_max?: number | null;
  per_cpu_percent: number[];
}

export interface MemoryMetrics {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  usage_percent: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
  swap_percent: number;
}

export interface DiskPartition {
  device: string;
  mountpoint: string;
  fstype: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  percent: number;
}

export interface DiskMetrics {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  usage_percent: number;
  partitions: DiskPartition[];
}

export interface NetworkInterfaceMetrics {
  name: string;
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
  is_up: boolean;
}

export interface NetworkMetrics {
  upload_speed_bps: number;
  download_speed_bps: number;
  total_bytes_sent: number;
  total_bytes_recv: number;
  interfaces: NetworkInterfaceMetrics[];
}

export interface SystemMetrics {
  hostname: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  architecture: string;
  uptime_seconds: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  boot_time: number;
}

export interface SystemSnapshot {
  timestamp: number;
  iso_time: string;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  system: SystemMetrics;
}

export interface MetricHistoryPoint {
  timestamp: number;
  iso_time: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  net_rx_bps: number;
  net_tx_bps: number;
}

export interface ServiceInfo {
  name: string;
  description: string;
  active_state: string;
  sub_state: string;
  load_state: string;
  status: "running" | "stopped" | "failed" | "unknown";
  is_active: boolean;
  is_enabled: boolean | null;
  allowlisted: boolean;
}

export interface ServiceActionResponse {
  success: boolean;
  action: string;
  service_name: string;
  message: string;
  details?: string | null;
}

export interface ProcessMetrics {
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_percent: number;
  memory_rss_bytes: number;
  status: string;
  num_threads: number;
}

export interface AuditLogEntry {
  id?: number;
  timestamp: string;
  username: string;
  service_name: string;
  action: string;
  success: boolean;
  details?: string | null;
  ip_address?: string | null;
}

export interface UserInfo {
  username: string;
  is_admin: boolean;
}
