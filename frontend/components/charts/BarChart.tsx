"use client";

import React from "react";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  const safeData = data ?? [];
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center text-[11px] text-muted-foreground w-full bg-zinc-950/10 border border-border/20 rounded-xl" style={{ height }}>
        No scan volume data recorded.
      </div>
    );
  }

  const maxVal = Math.max(...safeData.map((d) => d.value), 1);

  return (
    <div className="w-full flex items-end gap-3 justify-between pt-6 border-b border-border/40" style={{ height }}>
      {safeData.map((item, idx) => {
        const percentage = (item.value / maxVal) * 100;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
            <div className="text-[10px] font-black text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 px-1 py-0.5 rounded border border-border/40">
              {item.value}
            </div>
            <div
              className="w-full rounded-t bg-gradient-to-t from-primary/30 to-primary transition-all duration-500 hover:brightness-125"
              style={{ height: `${percentage}%` }}
            />
            <div className="text-[9px] font-bold text-muted-foreground truncate w-full text-center mt-1">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default BarChart;
