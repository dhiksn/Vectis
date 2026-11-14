"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { OverviewView } from "@/components/dashboard/OverviewView";

export default function OverviewPage() {
  return (
    <DashboardShell>
      {({ snapshot, history, connectionStatus }) => (
        <OverviewView
          snapshot={snapshot}
          history={history}
          connectionStatus={connectionStatus}
        />
      )}
    </DashboardShell>
  );
}
