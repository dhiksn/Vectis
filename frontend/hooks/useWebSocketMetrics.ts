"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SystemSnapshot, MetricHistoryPoint } from "@/types";
import { getStoredToken, API_BASE } from "@/lib/api";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export function useWebSocketMetrics() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [history, setHistory] = useState<MetricHistoryPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const getWsUrl = useCallback(() => {
    const token = getStoredToken();
    let base = API_BASE;
    if (base.startsWith("http://")) {
      base = base.replace("http://", "ws://");
    } else if (base.startsWith("https://")) {
      base = base.replace("https://", "wss://");
    }
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${base}/ws/metrics${tokenParam}`;
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    const token = getStoredToken();
    if (!token) {
      // Don't connect if user has not authenticated yet
      setStatus("disconnected");
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.cpu && data.memory) {
            const snap = data as SystemSnapshot;
            setSnapshot(snap);
            setLastUpdated(new Date());

            // Append to in-memory sliding history window (max 30 points)
            setHistory((prev) => {
              const newPoint: MetricHistoryPoint = {
                timestamp: snap.timestamp,
                iso_time: snap.iso_time,
                cpu_percent: snap.cpu.usage_percent,
                memory_percent: snap.memory.usage_percent,
                disk_percent: snap.disk.usage_percent,
                net_rx_bps: snap.network.download_speed_bps,
                net_tx_bps: snap.network.upload_speed_bps,
              };
              const updated = [...prev, newPoint];
              return updated.length > 30 ? updated.slice(updated.length - 30) : updated;
            });
          }
        } catch {
          // Non-json or ping message
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        wsRef.current = null;
        if (event.code === 1008 || event.code === 4403 || event.code === 1006) {
          // Check if token was invalidated
          if (!getStoredToken()) {
            setStatus("disconnected");
            return;
          }
        }

        setStatus("reconnecting");
        // Exponential backoff reconnect: 2s, 4s, 8s, up to 15s
        const backoffMs = Math.min(15000, 2000 * Math.pow(1.5, reconnectAttemptsRef.current));
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoffMs);
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setStatus("reconnecting");
        ws.close();
      };
    } catch {
      setStatus("disconnected");
    }
  }, [getWsUrl]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    snapshot,
    status,
    history,
    lastUpdated,
    reconnect,
  };
}
