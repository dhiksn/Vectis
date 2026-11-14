"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProcessesView } from "@/components/processes/ProcessesView";

export default function ProcessesPage() {
  return (
    <DashboardShell>
      {() => <ProcessesView />}
    </DashboardShell>
  );
}
