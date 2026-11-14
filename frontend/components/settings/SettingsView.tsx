"use client";

import React, { useEffect, useState } from "react";
import { Settings, ShieldCheck, Database, Sliders, LogOut } from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { api } from "@/lib/api";

interface SettingsViewProps {
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    api.getServerConfig().then(setConfig).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-base font-display font-semibold text-ink">Control Center Configuration</h2>
        <p className="text-xs text-muted mt-0.5">Security policies, allowlist boundaries, and telemetry parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Service Allowlist */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                Server-Side Service Allowlist
              </span>
            </div>
          }
        >
          <p className="text-xs text-muted mb-4 leading-relaxed font-display">
            In compliance with strict security requirements, only services pre-registered in the server configuration can be controlled. Frontend clients cannot expand this allowlist.
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {config?.service_allowlist?.map((s: string) => (
              <span
                key={s}
                className="px-2.5 py-1 bg-paper-3 text-ink rounded border border-rule font-medium"
              >
                {s}.service
              </span>
            )) || <span className="text-muted">Loading configuration...</span>}
          </div>
        </CutCard>

        {/* Database & Telemetry Settings */}
        <CutCard
          header={
            <div className="flex items-center gap-2">
              <Database size={16} className="text-accent" />
              <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
                Telemetry & Storage Policies
              </span>
            </div>
          }
        >
          <div className="divide-y divide-rule text-xs font-mono">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted font-display">Sampling Frequency</span>
              <span className="text-ink font-semibold">{config?.metrics_interval_seconds || 3} seconds</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted font-display">Database Retention Window</span>
              <span className="text-accent font-semibold">{config?.data_retention_hours || 48} hours</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted font-display">Agent Local Host</span>
              <span className="text-ink">{config?.agent_host || "127.0.0.1"}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted font-display">Agent Internal Port</span>
              <span className="text-ink">{config?.agent_port || 8000}</span>
            </div>
          </div>
        </CutCard>
      </div>

      {/* Account Session */}
      <CutCard
        header={
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-accent" />
            <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
              Administrator Session
            </span>
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-ink font-display">Authenticated as Administrator</div>
            <div className="text-xs text-muted font-mono mt-0.5">JWT Session active · HTTP-only cookie</div>
          </div>
          <KeyButton variant="danger" size="sm" onClick={onLogout}>
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </KeyButton>
        </div>
      </CutCard>
    </div>
  );
};
