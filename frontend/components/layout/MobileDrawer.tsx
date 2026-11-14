"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Server,
  Activity,
  HardDrive,
  Network,
  Cpu,
  Settings,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { ConnectionStatus } from "@/hooks/useWebSocketMetrics";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: ConnectionStatus;
  hostname?: string;
  uptime?: string;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: Server },
  { href: "/processes", label: "Processes", icon: Activity },
  { href: "/storage", label: "Storage", icon: HardDrive },
  { href: "/network", label: "Network", icon: Network },
  { href: "/system", label: "System", icon: Cpu },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  hostname = "vps-node",
  uptime = "--",
  onLogout,
}) => {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-paper h-full border-r border-rule flex flex-col z-10 shadow-2xl">
        <div className="h-16 flex items-center justify-between px-4 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-ink font-display font-bold text-sm">
              VC
            </div>
            <span className="font-display font-semibold text-sm text-ink">
              VECTIS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-ink hover:bg-paper-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-3 rounded text-sm font-display font-medium transition-all",
                  isActive
                    ? "bg-paper-2 text-ink border-l-2 border-accent"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                )}
              >
                <Icon size={18} className={isActive ? "text-accent" : "text-muted"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Server Info */}
        <div className="p-4 mx-3 mb-4 cut bg-paper-2 border-rule text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted uppercase text-[10px]">Host</span>
            <span className="font-mono text-ink text-[11px] truncate">{hostname}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted uppercase text-[10px]">Uptime</span>
            <span className="font-mono text-ink text-[11px]">{uptime}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-rule">
            <span className="text-muted uppercase text-[10px]">Status</span>
            <StatusDot status={connectionStatus} />
          </div>
        </div>

        {/* User bar */}
        <div className="p-4 border-t border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <span className="font-display text-xs text-ink">Administrator</span>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-muted hover:text-error transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
