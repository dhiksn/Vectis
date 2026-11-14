"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface DataPoint {
  time: string;
  value: number;
}

interface ResourceAreaChartProps {
  data: DataPoint[];
  color?: string;
  unit?: string;
  height?: number;
  domain?: [number, number | "auto"];
}

export const ResourceAreaChart: React.FC<ResourceAreaChartProps> = ({
  data,
  color = "var(--color-accent)",
  unit = "%",
  height = 80,
  domain = [0, 100],
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center text-xs font-mono text-muted bg-paper rounded border border-rule border-dashed"
      >
        Awaiting telemetry...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }} className="relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${unit}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={domain} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="bg-paper-2 border border-rule px-2 py-1 rounded shadow-md text-[11px] font-mono text-ink">
                    <span className="text-muted mr-1.5">{item.payload.time}</span>
                    <span className="font-semibold text-accent">
                      {typeof item.value === "number" ? item.value.toFixed(1) : item.value}
                      {unit}
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#gradient-${unit})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
