"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Network, ArrowDown, ArrowUp, RefreshCw, Activity } from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { NetworkMetrics } from "@/types";
import { api } from "@/lib/api";
import { formatBytes, formatSpeed } from "@/lib/formatters";

export const NetworkView: React.FC = () => {
  const [network, setNetwork] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNetwork = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getNetworkInfo();
      setNetwork(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNetwork();
    const interval = setInterval(loadNetwork, 3000);
    return () => clearInterval(interval);
  }, [loadNetwork]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-ink">Network Subsystem</h2>
          <p className="text-xs text-muted mt-0.5">Real-time bandwidth throughput rate and interface telemetry.</p>
        </div>
        <KeyButton size="sm" onClick={loadNetwork} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </KeyButton>
      </div>

      {network && (
        <>
          {/* Real-time Bandwidth Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CutCard header="Current Download Speed">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-success/10 text-success">
                  <ArrowDown size={22} />
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-ink num">
                    {formatSpeed(network.download_speed_bps)}
                  </div>
                  <div className="text-[11px] text-muted font-display">Delta computed rate</div>
                </div>
              </div>
            </CutCard>

            <CutCard header="Current Upload Speed">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-accent/10 text-accent">
                  <ArrowUp size={22} />
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-ink num">
                    {formatSpeed(network.upload_speed_bps)}
                  </div>
                  <div className="text-[11px] text-muted font-display">Delta computed rate</div>
                </div>
              </div>
            </CutCard>

            <CutCard header="Total Inbound (RX)">
              <div className="font-mono text-2xl font-semibold text-ink num">
                {formatBytes(network.total_bytes_recv)}
              </div>
              <div className="text-[11px] text-muted font-display mt-1">Cumulative network traffic</div>
            </CutCard>

            <CutCard header="Total Outbound (TX)">
              <div className="font-mono text-2xl font-semibold text-ink num">
                {formatBytes(network.total_bytes_sent)}
              </div>
              <div className="text-[11px] text-muted font-display mt-1">Cumulative network traffic</div>
            </CutCard>
          </div>

          {/* Detailed Network Interfaces Table */}
          <CutCard
            header={
              <div className="flex items-center gap-2">
                <Network size={16} className="text-accent" />
                <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                  Configured Network Adapters ({network.interfaces.length})
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                    <th className="pb-3 font-medium">Interface</th>
                    <th className="pb-3 font-medium">Link Status</th>
                    <th className="pb-3 font-medium text-right">Packets Received</th>
                    <th className="pb-3 font-medium text-right">Packets Sent</th>
                    <th className="pb-3 font-medium text-right">Data Inbound</th>
                    <th className="pb-3 font-medium text-right">Data Outbound</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule text-[11px]">
                  {network.interfaces.map((nic) => (
                    <tr key={nic.name} className="hover:bg-paper-3/40 transition-colors">
                      <td className="py-3 font-semibold text-ink">{nic.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-display font-medium ${
                          nic.is_up ? "bg-success/15 text-success" : "bg-paper-3 text-muted"
                        }`}>
                          {nic.is_up ? "LINK UP" : "DOWN"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted num">{nic.packets_recv.toLocaleString()}</td>
                      <td className="py-3 text-right text-muted num">{nic.packets_sent.toLocaleString()}</td>
                      <td className="py-3 text-right text-ink font-medium num">{formatBytes(nic.bytes_recv)}</td>
                      <td className="py-3 text-right text-ink font-medium num">{formatBytes(nic.bytes_sent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CutCard>
        </>
      )}
    </div>
  );
};
