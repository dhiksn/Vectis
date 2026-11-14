"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StorageView } from "@/components/storage/StorageView";

export default function StoragePage() {
  return (
    <DashboardShell>
      {() => <StorageView />}
    </DashboardShell>
  );
}
