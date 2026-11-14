"use client";

import { useState, useEffect, useCallback } from "react";

// In-memory persistent state across Next.js client-side page transitions
let globalCollapsedState: boolean = false;
let globalInitialized: boolean = false;
const listeners = new Set<(val: boolean) => void>();

export function usePersistentSidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (!globalInitialized) {
        const stored = localStorage.getItem("vps_sidebar_collapsed");
        globalCollapsedState = stored === "true";
        globalInitialized = true;
      }
      return globalCollapsedState;
    }
    return false;
  });

  useEffect(() => {
    const listener = (val: boolean) => setCollapsed(val);
    listeners.add(listener);

    // Sync on mount if changed
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vps_sidebar_collapsed") === "true";
      if (stored !== collapsed) {
        setCollapsed(stored);
        globalCollapsedState = stored;
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !globalCollapsedState;
    globalCollapsedState = next;
    if (typeof window !== "undefined") {
      localStorage.setItem("vps_sidebar_collapsed", String(next));
    }
    listeners.forEach((fn) => fn(next));
  }, []);

  return [collapsed, toggle] as const;
}
