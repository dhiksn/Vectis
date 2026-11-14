import {
  SystemSnapshot,
  MetricHistoryPoint,
  ServiceInfo,
  ServiceActionResponse,
  ProcessMetrics,
  AuditLogEntry,
  SystemMetrics,
  DiskMetrics,
  NetworkMetrics,
  UserInfo,
} from "@/types";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    // If running in browser and NEXT_PUBLIC_API_URL is set, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Default to port 8000 on the same host
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

export const API_BASE = getApiBaseUrl();

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vps_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("vps_token", token);
  } else {
    localStorage.removeItem("vps_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${getApiBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // send cookies
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      setStoredToken(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ access_token: string; username: string }> {
    const data = await request<{ access_token: string; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe(): Promise<UserInfo> {
    return request<UserInfo>("/api/auth/me");
  },

  // Metrics
  async getCurrentMetrics(): Promise<SystemSnapshot> {
    return request<SystemSnapshot>("/api/metrics/current");
  },

  async getMetricsHistory(limit: number = 60): Promise<MetricHistoryPoint[]> {
    return request<MetricHistoryPoint[]>(`/api/metrics/history?limit=${limit}`);
  },

  // Services
  async getServices(search?: string): Promise<ServiceInfo[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<ServiceInfo[]>(`/api/services${q}`);
  },

  async getService(name: string): Promise<ServiceInfo> {
    return request<ServiceInfo>(`/api/services/${encodeURIComponent(name)}`);
  },

  async triggerServiceAction(serviceName: string, action: "start" | "stop" | "restart"): Promise<ServiceActionResponse> {
    return request<ServiceActionResponse>(`/api/services/${encodeURIComponent(serviceName)}/action`, {
      method: "POST",
      body: JSON.stringify({ service_name: serviceName, action }),
    });
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    return request<AuditLogEntry[]>(`/api/services/audit-logs?limit=${limit}`);
  },

  // Processes
  async getProcesses(sortBy: "cpu" | "memory" | "name" = "cpu", limit: number = 50, search?: string): Promise<ProcessMetrics[]> {
    const params = new URLSearchParams({ sort_by: sortBy, limit: limit.toString() });
    if (search) params.set("search", search);
    return request<ProcessMetrics[]>(`/api/processes?${params.toString()}`);
  },

  // System
  async getSystemInfo(): Promise<SystemMetrics> {
    return request<SystemMetrics>("/api/system/info");
  },

  async getStorageInfo(): Promise<DiskMetrics> {
    return request<DiskMetrics>("/api/system/storage");
  },

  async getNetworkInfo(): Promise<NetworkMetrics> {
    return request<NetworkMetrics>("/api/system/network");
  },

  async getServerConfig(): Promise<any> {
    return request<any>("/api/system/config");
  },
};
