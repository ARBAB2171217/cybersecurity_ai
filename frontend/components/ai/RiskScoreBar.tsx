"use client";

import { cn } from "@/lib/utils";

interface RiskScoreBarProps {
  value: number; // 0–100
  className?: string;
}

function riskLabel(value: number): { label: string; color: string; bg: string; border: string } {
  if (value <= 20) return { label: "MINIMAL",  color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/20" };
  if (value <= 45) return { label: "LOW",       color: "text-teal-400",    bg: "bg-teal-500",   border: "border-teal-500/20" };
  if (value <= 65) return { label: "MEDIUM",    color: "text-amber-400",   bg: "bg-amber-500",  border: "border-amber-500/20" };
  if (value <= 80) return { label: "HIGH",      color: "text-orange-400",  bg: "bg-orange-500", border: "border-orange-500/20" };
  return                  { label: "CRITICAL",  color: "text-red-400",     bg: "bg-red-500",    border: "border-red-500/20" };
}

/**
 * Horizontal segmented risk bar with animated fill and label.
 */
export function RiskScoreBar({ value, className }: RiskScoreBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const { label, color, bg, border } = riskLabel(pct);

  // 5-segment ticks
  const segments = [20, 40, 60, 80, 100];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">
            Risk Score
          </span>
          <span className={cn("text-3xl font-black", color)}>{pct}</span>
          <span className="text-sm text-muted-foreground font-semibold ml-1">/100</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
            color,
            border,
            "bg-opacity-10"
          )}
        >
          {label}
        </span>
      </div>

      {/* Segmented progress track */}
      <div className="relative h-3 w-full rounded-full bg-zinc-800/60 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", bg)}
          style={{ width: `${pct}%` }}
        />
        {/* Tick marks */}
        {segments.slice(0, -1).map((s) => (
          <div
            key={s}
            className="absolute top-0 h-full w-px bg-background/40"
            style={{ left: `${s}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
        <span>Safe</span>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Critical</span>
      </div>
    </div>
  );
}
export default RiskScoreBar;
