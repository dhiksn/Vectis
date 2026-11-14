"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ServicesView } from "@/components/services/ServicesView";

export default function ServicesPage() {
  return (
    <DashboardShell>
      {() => <ServicesView />}
    </DashboardShell>
  );
}
