"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SystemView } from "@/components/system/SystemView";

export default function SystemPage() {
  return (
    <DashboardShell>
      {() => <SystemView />}
    </DashboardShell>
  );
}
