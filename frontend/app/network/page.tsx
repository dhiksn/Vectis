"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NetworkView } from "@/components/network/NetworkView";

export default function NetworkPage() {
  return (
    <DashboardShell>
      {() => <NetworkView />}
    </DashboardShell>
  );
}
