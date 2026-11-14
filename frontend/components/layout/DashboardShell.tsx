"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { useWebSocketMetrics } from "@/hooks/useWebSocketMetrics";
import { usePersistentSidebar } from "@/hooks/usePersistentSidebar";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import { formatUptime } from "@/lib/formatters";

interface DashboardShellProps {
  children: (props: {
    snapshot: ReturnType<typeof useWebSocketMetrics>["snapshot"];
    history: ReturnType<typeof useWebSocketMetrics>["history"];
    connectionStatus: ReturnType<typeof useWebSocketMetrics>["status"];
    reconnect: ReturnType<typeof useWebSocketMetrics>["reconnect"];
  }) => React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const router = useRouter();
  const [collapsed, toggleCollapse] = usePersistentSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    api
      .getMe()
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch(() => {
        setStoredToken(null);
        router.replace("/login");
      });
  }, [router]);

  const { snapshot, status, history, lastUpdated, reconnect } = useWebSocketMetrics();

  const handleLogout = async () => {
    await api.logout();
    router.replace("/login");
  };

  const hostname = snapshot?.system.hostname || "vps-node";
  const uptime = snapshot?.system.uptime_seconds
    ? formatUptime(snapshot.system.uptime_seconds)
    : "--";

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-paper flex flex-col items-center justify-center font-display text-xs text-muted space-y-2 select-none">
        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-ink font-bold animate-pulse">
          VC
        </div>
        <span>Verifying administrator session...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        connectionStatus={status}
        hostname={hostname}
        uptime={uptime}
        onLogout={handleLogout}
      />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        connectionStatus={status}
        hostname={hostname}
        uptime={uptime}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          connectionStatus={status}
          lastUpdated={lastUpdated}
          onRefresh={reconnect}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 cobalt-ascii-grid">
          <div className="max-w-[1440px] mx-auto">
            {children({
              snapshot,
              history,
              connectionStatus: status,
              reconnect,
            })}
          </div>
        </main>
      </div>
    </div>
  );
};
