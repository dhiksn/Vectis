"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { ProcessMetrics } from "@/types";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/formatters";

export const ProcessesView: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessMetrics[]>([]);
  const [sortBy, setSortBy] = useState<"cpu" | "memory" | "name">("cpu");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProcesses(sortBy, 60, search);
      setProcesses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sortBy, search]);

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 5000);
    return () => clearInterval(interval);
  }, [loadProcesses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Controls: Search and Sort Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search processes by executable name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-paper-2 border border-rule rounded text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent font-display"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-paper-2 border border-rule rounded p-0.5 text-xs">
            <button
              onClick={() => setSortBy("cpu")}
              className={`px-3 py-1 rounded text-xs font-display font-medium transition-colors ${
                sortBy === "cpu" ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              Sort CPU
            </button>
            <button
              onClick={() => setSortBy("memory")}
              className={`px-3 py-1 rounded text-xs font-display font-medium transition-colors ${
                sortBy === "memory" ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              Sort RAM
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`px-3 py-1 rounded text-xs font-display font-medium transition-colors ${
                sortBy === "name" ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              Sort Name
            </button>
          </div>

          <KeyButton size="sm" onClick={loadProcesses} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </KeyButton>
        </div>
      </div>

      {/* Process Table Card */}
      <CutCard
        header={
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
              Top Running Processes ({processes.length})
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                <th className="pb-3 font-medium">PID</th>
                <th className="pb-3 font-medium">Executable Name</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">CPU %</th>
                <th className="pb-3 font-medium text-right">RAM (RSS)</th>
                <th className="pb-3 font-medium text-right">RAM %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[11px]">
              {processes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    {loading ? "Sampling processes..." : "No matching processes found."}
                  </td>
                </tr>
              ) : (
                processes.map((proc) => (
                  <tr key={proc.pid} className="hover:bg-paper-3/40 transition-colors">
                    <td className="py-2.5 text-muted">{proc.pid}</td>
                    <td className="py-2.5 font-semibold text-ink truncate max-w-xs" title={proc.name}>
                      {proc.name}
                    </td>
                    <td className="py-2.5 text-muted">{proc.username}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper-3 text-ink-2 uppercase">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-accent num">
                      {proc.cpu_percent.toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right text-muted num">
                      {formatBytes(proc.memory_rss_bytes)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-ink num">
                      {proc.memory_percent.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CutCard>
    </div>
  );
};
