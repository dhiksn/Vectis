import React from "react";
import { clsx } from "clsx";

interface StatusDotProps {
  status: "connected" | "reconnecting" | "disconnected" | "running" | "stopped" | "failed" | "unknown";
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, className }) => {
  const getDotColor = () => {
    switch (status) {
      case "connected":
      case "running":
        return "bg-success";
      case "reconnecting":
        return "bg-amber-400 animate-pulse";
      case "disconnected":
      case "stopped":
        return "bg-muted";
      case "failed":
        return "bg-error";
      default:
        return "bg-muted";
    }
  };

  const getLabel = () => {
    if (label) return label;
    switch (status) {
      case "connected":
        return "Connected";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={clsx("inline-flex items-center gap-2 text-xs font-medium text-ink", className)}>
      <span className={clsx("w-2 h-2 rounded-full inline-block", getDotColor())} />
      <span>{getLabel()}</span>
    </div>
  );
};
