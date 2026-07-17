"use client";

import { cn } from "@/lib/utils";

interface ConfidenceGaugeProps {
  value: number; // 0–1
  className?: string;
}

/**
 * Circular arc gauge for confidence score (0–100%).
 * Uses an SVG stroke-dashoffset trick — no external charting lib needed.
 */
export function ConfidenceGauge({ value, className }: ConfidenceGaugeProps) {
  const pct = Math.min(1, Math.max(0, value));
  const display = (pct * 100).toFixed(1);

  // Arc geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - pct);

  const color =
    pct >= 0.85
      ? "#34d399" // emerald
      : pct >= 0.6
      ? "#fbbf24" // amber
      : "#f87171"; // red

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative h-36 w-36">
        {/* Track */}
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          fill="none"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-foreground">{display}%</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Confidence
          </span>
        </div>
      </div>
    </div>
  );
}
export default ConfidenceGauge;
