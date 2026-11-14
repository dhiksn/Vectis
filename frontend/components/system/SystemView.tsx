"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Cpu, RefreshCw, Server, Terminal, Shield, CheckCircle } from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { SystemMetrics } from "@/types";
import { api } from "@/lib/api";
import { formatUptime } from "@/lib/formatters";

export const SystemView: React.FC = () => {
  const [system, setSystem] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSystem = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSystemInfo();
      setSystem(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystem();
  }, [loadSystem]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-ink">Host System Diagnostics</h2>
          <p className="text-xs text-muted mt-0.5">Operating environment, kernel identification, and load characteristics.</p>
        </div>
        <KeyButton size="sm" onClick={loadSystem} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </KeyButton>
      </div>

      {system && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CutCard
            header={
              <div className="flex items-center gap-2">
                <Server size={16} className="text-accent" />
                <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                  Operating System & Hardware
                </span>
              </div>
            }
          >
            <div className="divide-y divide-rule text-xs font-mono">
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Hostname</span>
                <span className="font-semibold text-ink">{system.hostname}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Operating System</span>
                <span className="text-ink">{system.os_name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Distribution Release</span>
                <span className="text-ink font-semibold">{system.os_version}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Kernel Version</span>
                <span className="text-ink-2">{system.kernel_version}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">CPU Architecture</span>
                <span className="text-accent font-semibold">{system.architecture}</span>
              </div>
            </div>
          </CutCard>

          <CutCard
            header={
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-accent" />
                <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                  Runtime & Load Averages
                </span>
              </div>
            }
          >
            <div className="divide-y divide-rule text-xs font-mono">
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">System Uptime</span>
                <span className="font-semibold text-accent">{formatUptime(system.uptime_seconds)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Booted At</span>
                <span className="text-ink">{new Date(system.boot_time * 1000).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Load Average (1m)</span>
                <span className="text-ink font-semibold num">{system.load_avg_1m}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Load Average (5m)</span>
                <span className="text-ink font-semibold num">{system.load_avg_5m}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted font-display">Load Average (15m)</span>
                <span className="text-ink font-semibold num">{system.load_avg_15m}</span>
              </div>
            </div>
          </CutCard>
        </div>
      )}
    </div>
  );
};
