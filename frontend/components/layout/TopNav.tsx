"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, RefreshCw, Clock, Radio } from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { KeyButton } from "@/components/ui/KeyButton";
import { ConnectionStatus } from "@/hooks/useWebSocketMetrics";

interface TopNavProps {
  connectionStatus: ConnectionStatus;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onOpenMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  connectionStatus,
  lastUpdated,
  onRefresh,
  onOpenMobileMenu,
}) => {
  const pathname = usePathname();
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (pathname) {
      case "/":
        return "System Overview";
      case "/services":
        return "Systemd Services";
      case "/processes":
        return "Active Processes";
      case "/storage":
        return "Storage & Partitions";
      case "/network":
        return "Network Interfaces";
      case "/system":
        return "System Specifications";
      case "/settings":
        return "Control Center Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="h-16 border-b border-rule bg-paper-2 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-ink-2 hover:text-ink rounded border border-rule hover:bg-paper-3 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-display text-xs text-muted hidden sm:inline">VECTIS</span>
          <span className="text-muted hidden sm:inline">/</span>
          <h1 className="font-display font-semibold text-sm sm:text-base text-ink tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Live Telemetry, Connection & Action buttons */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs text-ink-2 bg-paper px-2.5 py-1 rounded border border-rule">
          <Clock size={13} className="text-muted" />
          <span className="num">{timeString || "--:--:--"}</span>
          <span className="text-[10px] text-muted ml-1">UTC</span>
        </div>

        {/* Real-time Stream Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-paper rounded border border-rule">
          <Radio size={12} className={connectionStatus === "connected" ? "text-success animate-pulse" : "text-muted"} />
          <StatusDot status={connectionStatus} />
        </div>

        {/* Refresh Button */}
        <KeyButton
          size="sm"
          onClick={onRefresh}
          title="Refresh server data"
          className="hidden sm:inline-flex"
        >
          <RefreshCw size={14} className="text-ink" />
          <span className="text-xs">Refresh</span>
        </KeyButton>
      </div>
    </header>
  );
};
