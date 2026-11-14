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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { ConnectionStatus } from "@/hooks/useWebSocketMetrics";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  connectionStatus,
  hostname = "vps-node",
  uptime = "--",
  onLogout,
}) => {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col border-r border-rule bg-paper transition-all duration-200 z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header & Toggle */}
      <div
        className={clsx(
          "h-16 flex items-center border-b border-rule",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed ? (
          <>
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-ink font-display font-bold text-sm shrink-0 shadow-sm">
                VC
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-semibold text-sm tracking-tight text-ink">
                  VECTIS
                </span>
                <span className="font-mono text-[10px] text-muted tracking-wider uppercase mt-1">
                  COBALT CONTROL v1.0
                </span>
              </div>
            </Link>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded text-muted hover:text-ink hover:bg-paper-2 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div className="relative group">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded text-muted hover:text-ink hover:bg-paper-2 transition-colors flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-paper-2 text-ink text-xs font-display font-medium rounded border border-rule shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50">
              Expand Sidebar
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links with Hover Tooltips */}
      <nav className="flex-1 px-2 py-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center rounded text-xs font-display font-medium transition-all",
                  collapsed
                    ? "justify-center w-10 h-10 mx-auto"
                    : "gap-3 px-3 py-2.5 w-full",
                  isActive
                    ? "bg-paper-2 text-ink border-l-2 border-accent shadow-sm"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                )}
              >
                <Icon
                  size={18}
                  className={clsx(
                    "shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-muted group-hover:text-ink"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>

              {/* Floating Tooltip in Collapsed Mode */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-paper-2 text-ink text-xs font-display font-medium rounded border border-rule shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Node Status Info Block (Expanded only) */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 cut bg-paper-2 border-rule text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-muted text-[11px] uppercase tracking-wide">Node Host</span>
            <span className="font-mono text-ink text-[11px] truncate max-w-[110px]">{hostname}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-display text-muted text-[11px] uppercase tracking-wide">Uptime</span>
            <span className="font-mono text-ink text-[11px]">{uptime}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-rule">
            <span className="font-display text-muted text-[11px] uppercase tracking-wide">Status</span>
            <StatusDot status={connectionStatus} />
          </div>
        </div>
      )}

      {/* Administrator Profile / Logout */}
      <div
        className={clsx(
          "p-3 border-t border-rule flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-paper-3 border border-rule flex items-center justify-center font-display text-xs text-muted">
                <ShieldCheck size={14} className="text-accent" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-display text-xs font-medium text-ink truncate">Administrator</span>
                <span className="font-mono text-[10px] text-muted truncate">admin@localhost</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded text-muted hover:text-error hover:bg-paper-2 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <div className="relative group">
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded flex items-center justify-center text-muted hover:text-error hover:bg-paper-2 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-paper-2 text-error text-xs font-display font-medium rounded border border-rule shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50">
              Sign Out
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
