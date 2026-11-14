"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Play,
  Square,
  RotateCw,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  History,
} from "lucide-react";
import { CutCard } from "@/components/ui/CutCard";
import { KeyButton } from "@/components/ui/KeyButton";
import { StatusDot } from "@/components/ui/StatusDot";
import { ServiceInfo, AuditLogEntry } from "@/types";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    serviceName: string;
    action: "start" | "stop" | "restart";
  }>({
    isOpen: false,
    serviceName: "",
    action: "restart",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesData, logsData] = await Promise.all([
        api.getServices(search),
        api.getAuditLogs(15),
      ]);
      setServices(servicesData);
      setAuditLogs(logsData);
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to load services data",
      });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenConfirm = (serviceName: string, action: "start" | "stop" | "restart") => {
    setConfirmModal({
      isOpen: true,
      serviceName,
      action,
    });
  };

  const handleConfirmAction = async () => {
    const { serviceName, action } = confirmModal;
    setConfirmModal({ isOpen: false, serviceName: "", action: "restart" });
    setActionLoading(`${serviceName}-${action}`);
    setActionFeedback(null);

    try {
      const res = await api.triggerServiceAction(serviceName, action);
      if (res.success) {
        setActionFeedback({
          type: "success",
          message: res.message || `Successfully executed ${action} on ${serviceName}`,
        });
      } else {
        setActionFeedback({
          type: "error",
          message: res.message + (res.details ? `: ${res.details}` : ""),
        });
      }
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || `Failed to ${action} ${serviceName}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`cut p-4 flex items-center justify-between text-xs font-display ${
            actionFeedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs hover:underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header controls: Search and Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search allowlisted services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-paper-2 border border-rule rounded text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent font-display"
          />
        </div>
        <div className="flex items-center gap-2">
          <KeyButton size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Services</span>
          </KeyButton>
        </div>
      </div>

      {/* Services Table Card */}
      <CutCard
        header={
          <div className="flex items-center gap-2">
            <Server size={16} className="text-accent" />
            <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
              Allowlisted Systemd Services ({filteredServices.length})
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                <th className="pb-3 font-medium">Service Name</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Sub-state</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted font-mono text-xs">
                    {loading ? "Loading services..." : "No allowlisted services matching criteria."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => (
                  <tr key={svc.name} className="hover:bg-paper-3/40 transition-colors">
                    <td className="py-3 font-mono font-medium text-ink">
                      {svc.name}.service
                    </td>
                    <td className="py-3 text-muted text-xs max-w-xs truncate" title={svc.description}>
                      {svc.description}
                    </td>
                    <td className="py-3">
                      <StatusDot status={svc.status} />
                    </td>
                    <td className="py-3 font-mono text-[11px] text-ink-2">
                      {svc.sub_state} {svc.is_enabled !== null && (
                        <span className="text-muted">({svc.is_enabled ? "enabled" : "disabled"})</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {svc.status !== "running" && (
                          <KeyButton
                            size="sm"
                            onClick={() => handleOpenConfirm(svc.name, "start")}
                            disabled={actionLoading !== null}
                            title={`Start ${svc.name}`}
                          >
                            <Play size={12} className="text-success fill-success" />
                            <span className="text-[11px]">Start</span>
                          </KeyButton>
                        )}
                        {svc.status === "running" && (
                          <KeyButton
                            size="sm"
                            onClick={() => handleOpenConfirm(svc.name, "stop")}
                            disabled={actionLoading !== null}
                            title={`Stop ${svc.name}`}
                          >
                            <Square size={12} className="text-error fill-error" />
                            <span className="text-[11px]">Stop</span>
                          </KeyButton>
                        )}
                        <KeyButton
                          size="sm"
                          onClick={() => handleOpenConfirm(svc.name, "restart")}
                          disabled={actionLoading !== null}
                          title={`Restart ${svc.name}`}
                        >
                          <RotateCw
                            size={12}
                            className={`text-accent ${actionLoading === `${svc.name}-restart` ? "animate-spin" : ""}`}
                          />
                          <span className="text-[11px]">Restart</span>
                        </KeyButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CutCard>

      {/* Audit Log Card */}
      <CutCard
        header={
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent" />
            <span className="text-xs font-display font-semibold text-ink uppercase tracking-wide">
              Recent Service Action Audit Logs
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-rule text-muted font-display text-[11px] uppercase tracking-wide">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Result</th>
                <th className="pb-2 font-medium">Details</th>
                <th className="pb-2 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted">
                    No service audit log records yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-3/40 transition-colors">
                    <td className="py-2 text-muted">{formatDateTime(log.timestamp)}</td>
                    <td className="py-2 text-ink">{log.username}</td>
                    <td className="py-2 text-ink font-semibold">{log.service_name}</td>
                    <td className="py-2 uppercase text-accent">{log.action}</td>
                    <td className="py-2">
                      <span className={log.success ? "text-success" : "text-error"}>
                        {log.success ? "SUCCESS" : "REJECTED/FAILED"}
                      </span>
                    </td>
                    <td className="py-2 text-muted max-w-xs truncate" title={log.details || ""}>
                      {log.details || "-"}
                    </td>
                    <td className="py-2 text-muted">{log.ip_address || "local"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CutCard>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cut bg-paper-2 border-rule max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-error mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-base font-display font-semibold text-ink">
                Confirm Service {confirmModal.action.toUpperCase()}
              </h2>
            </div>
            <p className="text-xs text-ink-2 mb-6 leading-relaxed">
              Are you sure you want to <strong>{confirmModal.action}</strong> service{" "}
              <code className="px-1.5 py-0.5 bg-paper-3 rounded font-mono text-accent">
                {confirmModal.serviceName}
              </code>
              ? This will immediately affect active connections and daemons running under systemd.
            </p>
            <div className="flex items-center justify-end gap-3">
              <KeyButton
                size="md"
                onClick={() => setConfirmModal({ isOpen: false, serviceName: "", action: "restart" })}
              >
                Cancel
              </KeyButton>
              <KeyButton
                variant={confirmModal.action === "stop" ? "danger" : "primary"}
                size="md"
                onClick={handleConfirmAction}
              >
                Confirm {confirmModal.action}
              </KeyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
