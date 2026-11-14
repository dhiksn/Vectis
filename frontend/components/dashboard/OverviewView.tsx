"use client";

import React, { useMemo } from "react";
import {
  Cpu,
  Layers,
  HardDrive,
  Network,
  Activity,
  Server,
  Terminal,
  ArrowDown,
  ArrowUp,
  Shield,
  Gauge,
} from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { StatusDot } from "@/components/ui/StatusDot";
import { ResourceAreaChart } from "@/components/charts/ResourceAreaChart";
import { SystemSnapshot, MetricHistoryPoint } from "@/types";
import { formatBytes, formatSpeed, formatUptime, formatPercent } from "@/lib/formatters";

interface OverviewViewProps {
  snapshot: SystemSnapshot | null;
  history: MetricHistoryPoint[];
  connectionStatus: "connected" | "reconnecting" | "disconnected";
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  snapshot,
  history,
  connectionStatus,
}) => {
  // Chart data transformations
  const cpuChartData = useMemo(() => {
    return history.map((pt) => ({
      time: new Date(pt.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      value: pt.cpu_percent,
    }));
  }, [history]);

  const memChartData = useMemo(() => {
    return history.map((pt) => ({
      time: new Date(pt.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      value: pt.memory_percent,
    }));
  }, [history]);

  const netChartData = useMemo(() => {
    return history.map((pt) => ({
      time: new Date(pt.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      value: Number((pt.net_rx_bps / 1024).toFixed(1)), // in KB/s
    }));
  }, [history]);

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <div className="cut p-8 bg-paper-2 border-rule flex flex-col items-center justify-center text-center">
          <Activity size={32} className="text-accent animate-pulse mb-3" />
          <h2 className="text-base font-display font-semibold text-ink">Connecting to VPS Agent...</h2>
          <p className="text-xs text-muted mt-1 max-w-md">
            Establishing authenticated real-time telemetry stream. Ensure the agent is running on port 8000.
          </p>
        </div>
      </div>
    );
  }

  const { cpu, memory, disk, network, system } = snapshot;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Server System Info Banner */}
      <div className="cut p-4 sm:p-5 bg-paper-2 border-rule">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Host Node</div>
            <div className="font-mono text-xs sm:text-sm font-semibold text-ink mt-0.5 truncate">{system.hostname}</div>
          </div>
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Operating System</div>
            <div className="font-display text-xs sm:text-sm text-ink mt-0.5 truncate">{system.os_version}</div>
          </div>
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Kernel / Arch</div>
            <div className="font-mono text-xs sm:text-sm text-ink-2 mt-0.5 truncate">
              {system.kernel_version} ({system.architecture})
            </div>
          </div>
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Server Uptime</div>
            <div className="font-mono text-xs sm:text-sm font-semibold text-accent mt-0.5">
              {formatUptime(system.uptime_seconds)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Load Average</div>
            <div className="font-mono text-xs sm:text-sm text-ink mt-0.5">
              {system.load_avg_1m} <span className="text-muted">/</span> {system.load_avg_5m} <span className="text-muted">/</span> {system.load_avg_15m}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-display font-medium text-muted uppercase tracking-wider">Telemetry State</div>
            <div className="mt-1">
              <StatusDot status={connectionStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink tracking-wide uppercase">CPU Load</span>
            </div>
          }
          action={
            <span className="font-mono text-xs text-muted">
              {cpu.core_count_physical}c / {cpu.core_count_logical}t
            </span>
          }
        >
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-semibold text-3xl sm:text-4xl text-ink tracking-tight num">
              {cpu.usage_percent.toFixed(1)}%
            </div>
            {cpu.frequency_current && (
              <span className="font-mono text-xs text-muted">
                {cpu.frequency_current} MHz
              </span>
            )}
          </div>
          <div className="mt-2">
            <ResourceAreaChart data={cpuChartData} unit="%" height={65} domain={[0, 100]} />
          </div>
          {/* Per-Core Distribution Bar */}
          {cpu.per_cpu_percent.length > 0 && (
            <div className="mt-3 pt-3 border-t border-rule">
              <div className="flex items-center justify-between text-[10px] text-muted font-mono mb-1">
                <span>Cores ({cpu.per_cpu_percent.length})</span>
                <span>Active</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {cpu.per_cpu_percent.slice(0, 8).map((usage, idx) => (
                  <div key={idx} className="bg-paper-3 h-1.5 rounded-full overflow-hidden" title={`Core ${idx}: ${usage}%`}>
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, usage))}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CutCard>

        {/* RAM Card */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink tracking-wide uppercase">RAM Memory</span>
            </div>
          }
          action={
            <span className="font-mono text-xs text-muted">
              {formatBytes(memory.total_bytes)} Total
            </span>
          }
        >
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-semibold text-3xl sm:text-4xl text-ink tracking-tight num">
              {memory.usage_percent.toFixed(1)}%
            </div>
            <span className="font-mono text-xs text-muted">
              {formatBytes(memory.used_bytes)} used
            </span>
          </div>
          <div className="mt-2">
            <ResourceAreaChart data={memChartData} unit="%" height={65} domain={[0, 100]} />
          </div>
          {/* Swap Indicator */}
          <div className="mt-3 pt-3 border-t border-rule flex items-center justify-between text-xs">
            <span className="text-[11px] font-display text-muted">Swap Utilization</span>
            <span className="font-mono text-[11px] text-ink">
              {formatBytes(memory.swap_used_bytes)} / {formatBytes(memory.swap_total_bytes)} ({memory.swap_percent}%)
            </span>
          </div>
        </CutCard>

        {/* Disk Card */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink tracking-wide uppercase">Disk Storage</span>
            </div>
          }
          action={
            <span className="font-mono text-xs text-muted">
              {formatBytes(disk.total_bytes)} Total
            </span>
          }
        >
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-semibold text-3xl sm:text-4xl text-ink tracking-tight num">
              {disk.usage_percent.toFixed(1)}%
            </div>
            <span className="font-mono text-xs text-muted">
              {formatBytes(disk.free_bytes)} free
            </span>
          </div>
          {/* Storage Capacity Bar */}
          <div className="w-full bg-paper-3 h-2 rounded overflow-hidden my-3">
            <div
              className={`h-full transition-all duration-300 ${
                disk.usage_percent > 85 ? "bg-error" : "bg-accent"
              }`}
              style={{ width: `${Math.min(100, Math.max(2, disk.usage_percent))}%` }}
            />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-rule">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted">Used Storage</span>
              <span className="font-mono text-ink">{formatBytes(disk.used_bytes)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted">Mounted Partitions</span>
              <span className="font-mono text-ink">{disk.partitions.length} active</span>
            </div>
          </div>
        </CutCard>

        {/* Network Card */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <Network size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink tracking-wide uppercase">Network I/O</span>
            </div>
          }
          action={
            <span className="font-mono text-xs text-muted">
              {network.interfaces.length} NICs
            </span>
          }
        >
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowDown size={14} className="text-success" />
                <span>Download</span>
              </div>
              <span className="font-mono text-base font-semibold text-ink num">
                {formatSpeed(network.download_speed_bps)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowUp size={14} className="text-accent" />
                <span>Upload</span>
              </div>
              <span className="font-mono text-base font-semibold text-ink num">
                {formatSpeed(network.upload_speed_bps)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <ResourceAreaChart data={netChartData} unit=" KB/s" height={45} domain={[0, 'auto']} />
          </div>
          <div className="mt-3 pt-3 border-t border-rule flex items-center justify-between text-[11px] font-mono text-muted">
            <span>RX: {formatBytes(network.total_bytes_recv)}</span>
            <span>TX: {formatBytes(network.total_bytes_sent)}</span>
          </div>
        </CutCard>
      </div>

      {/* 3. Detailed Partition Breakdown & System Load Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Storage Partitions */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <HardDrive size={15} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                Mounted Filesystems
              </span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                  <th className="pb-2 font-medium">Mount</th>
                  <th className="pb-2 font-medium">Filesystem</th>
                  <th className="pb-2 font-medium text-right">Used / Total</th>
                  <th className="pb-2 font-medium text-right">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {disk.partitions.map((part, idx) => (
                  <tr key={idx} className="hover:bg-paper-3/40 transition-colors">
                    <td className="py-2.5 font-medium text-ink truncate max-w-[140px]" title={part.mountpoint}>
                      {part.mountpoint}
                    </td>
                    <td className="py-2.5 text-muted text-[11px]">{part.fstype || "auto"}</td>
                    <td className="py-2.5 text-right text-ink num">
                      {formatBytes(part.used_bytes)} / {formatBytes(part.total_bytes)}
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      <span className={part.percent > 85 ? "text-error" : "text-ink"}>
                        {part.percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CutCard>

        {/* Network Interfaces */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <Network size={15} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                Network Adapters
              </span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                  <th className="pb-2 font-medium">Interface</th>
                  <th className="pb-2 font-medium">State</th>
                  <th className="pb-2 font-medium text-right">Packets RX/TX</th>
                  <th className="pb-2 font-medium text-right">Data In / Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {network.interfaces.map((nic, idx) => (
                  <tr key={idx} className="hover:bg-paper-3/40 transition-colors">
                    <td className="py-2.5 font-medium text-ink">{nic.name}</td>
                    <td className="py-2.5">
                      <span className={nic.is_up ? "text-success text-[11px]" : "text-muted text-[11px]"}>
                        {nic.is_up ? "UP" : "DOWN"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted text-[11px] num">
                      {nic.packets_recv.toLocaleString()} / {nic.packets_sent.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-ink num text-[11px]">
                      {formatBytes(nic.bytes_recv)} / {formatBytes(nic.bytes_sent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CutCard>
      </div>

      {/* 4. Hallmark Cobalt ASCII Live Status Grid */}
      <div className="graphite p-4 cut text-xs font-mono select-none">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-rule-2/40 text-graphite-muted text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-accent-2" />
            <span>NODE TELEMETRY STREAM</span>
          </div>
          <span>CELL 8x16 :: ENCODING OKLCH</span>
        </div>
        <div className="text-graphite-ink opacity-90 leading-relaxed overflow-x-auto whitespace-pre">
{`+-----------------------------------------------------------------------------------------+
| [SYS] ${system.hostname.padEnd(16)} | CPU: ${String(cpu.usage_percent.toFixed(1) + "%").padEnd(7)} | RAM: ${String(memory.usage_percent.toFixed(1) + "%").padEnd(7)} | DISK: ${String(disk.usage_percent.toFixed(1) + "%").padEnd(7)} |
| [NET] RX: ${formatSpeed(network.download_speed_bps).padEnd(12)} | TX: ${formatSpeed(network.upload_speed_bps).padEnd(12)} | LOAD: ${system.load_avg_1m} ${system.load_avg_5m} ${system.load_avg_15m}               |
+-----------------------------------------------------------------------------------------+`}
        </div>
      </div>
    </div>
  );
};
