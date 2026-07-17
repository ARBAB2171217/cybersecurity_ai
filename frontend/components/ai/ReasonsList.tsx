"use client";

import { cn } from "@/lib/utils";
import type { DetectionReason } from "@/types/detection";
import { AlertTriangle, ShieldAlert, Info, AlertOctagon, CheckCircle2 } from "lucide-react";

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: AlertOctagon },
  HIGH:     { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: ShieldAlert },
  MEDIUM:   { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: AlertTriangle },
  LOW:      { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: Info },
};

interface ReasonsListProps {
  reasons: DetectionReason[];
  className?: string;
}

export function ReasonsList({ reasons, className }: ReasonsListProps) {
  if (!reasons.length) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-emerald-400 font-semibold">
          All security checks passed — no anomalies detected.
        </span>
      </div>
    );
  }

  // Sort: critical first
  const sorted = [...reasons].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((reason, idx) => {
        const cfg = SEVERITY_CONFIG[reason.severity];
        const Icon = cfg.icon;
        return (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border text-xs",
              cfg.bg,
              cfg.border
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.color)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("font-bold", cfg.color)}>
                  {reason.feature}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded",
                    cfg.bg,
                    cfg.color
                  )}
                >
                  {reason.severity}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                {reason.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default ReasonsList;
