"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  return (
    <DashboardShell>
      {() => <SettingsView onLogout={handleLogout} />}
    </DashboardShell>
  );
}
