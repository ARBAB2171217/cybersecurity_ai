"use client";

import React from "react";

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function LineChart({ data, height = 200 }: LineChartProps) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center text-[11px] text-muted-foreground w-full bg-zinc-950/10 border border-border/20 rounded-xl" style={{ height }}>
        No scan traffic telemetry recorded.
      </div>
    );
  }

  const maxVal = Math.max(...safeData.map((d) => d.value), 1);
  const width = 500;
  const svgHeight = 150;

  const points = safeData
    .map((item, idx) => {
      const denom = safeData.length > 1 ? safeData.length - 1 : 1;
      const x = (idx / denom) * width;
      const y = svgHeight - (item.value / maxVal) * svgHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full flex flex-col pt-4">
      <svg viewBox={`0 0 ${width} ${svgHeight}`} className="overflow-visible w-full" style={{ height }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" stopColor-opacity="0.4" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" stopColor-opacity="0.0" />
          </linearGradient>
        </defs>

        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        
        <polygon
          fill="url(#lineGrad)"
          points={`0,${svgHeight} ${points} ${width},${svgHeight}`}
        />
      </svg>
      <div className="flex justify-between mt-2 text-[9px] font-bold text-muted-foreground px-1">
        {safeData.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
export default LineChart;
