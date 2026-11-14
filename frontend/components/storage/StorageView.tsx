"use client";

import React, { useEffect, useState, useCallback } from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { DiskMetrics } from "@/types";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/formatters";

export const StorageView: React.FC = () => {
  const [disk, setDisk] = useState<DiskMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStorage = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getStorageInfo();
      setDisk(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-ink">Storage Volumes & Filesystems</h2>
          <p className="text-xs text-muted mt-0.5">Partition mount points and physical disk capacity breakdown.</p>
        </div>
        <KeyButton size="sm" onClick={loadStorage} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </KeyButton>
      </div>

      {disk && (
        <>
          {/* Aggregated Storage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CutCard header="Total Capacity">
              <div className="font-display font-semibold text-3xl text-ink num">
                {formatBytes(disk.total_bytes)}
              </div>
              <div className="text-xs text-muted mt-1 font-mono">Aggregated physical volumes</div>
            </CutCard>
            <CutCard header="Used Space">
              <div className="font-display font-semibold text-3xl text-accent num">
                {formatBytes(disk.used_bytes)}
              </div>
              <div className="text-xs text-muted mt-1 font-mono">
                {disk.usage_percent.toFixed(1)}% of total allocated
              </div>
            </CutCard>
            <CutCard header="Free Available">
              <div className="font-display font-semibold text-3xl text-ink num">
                {formatBytes(disk.free_bytes)}
              </div>
              <div className="text-xs text-muted mt-1 font-mono">
                {(100 - disk.usage_percent).toFixed(1)}% free capacity
              </div>
            </CutCard>
          </div>

          {/* Partitions List */}
          <div className="space-y-4">
            {disk.partitions.map((part, idx) => (
              <CutCard key={idx}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-rule">
                  <div>
                    <div className="font-mono text-sm font-semibold text-ink flex items-center gap-2">
                      <HardDrive size={15} className="text-accent" />
                      <span>{part.mountpoint}</span>
                      <span className="text-xs text-muted font-normal">({part.device})</span>
                    </div>
                    <div className="text-xs text-muted font-mono mt-0.5">
                      FSTYPE: <span className="text-ink-2">{part.fstype || "auto"}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <div className="text-sm font-semibold text-ink num">
                      {formatBytes(part.used_bytes)} / {formatBytes(part.total_bytes)}
                    </div>
                    <div className="text-xs text-muted">
                      {formatBytes(part.free_bytes)} free ({part.percent.toFixed(1)}% used)
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-paper-3 h-2.5 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      part.percent > 85 ? "bg-error" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, part.percent))}%` }}
                  />
                </div>
              </CutCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
