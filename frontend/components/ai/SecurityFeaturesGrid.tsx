"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SecurityFeaturesCheck } from "@/types/detection";

const FEATURE_LABELS: Record<keyof SecurityFeaturesCheck, string> = {
  watermark:        "Watermark Pattern",
  securityThread:   "Security Thread",
  intaglioPrinting: "Intaglio Printing",
  microlettering:   "Micro-Lettering",
  latentImage:      "Latent Image",
};

interface SecurityFeaturesGridProps {
  checks: SecurityFeaturesCheck;
  className?: string;
}

export function SecurityFeaturesGrid({ checks, className }: SecurityFeaturesGridProps) {
  const safeChecks = checks ?? {
    watermark: false,
    securityThread: false,
    intaglioPrinting: false,
    microlettering: false,
    latentImage: false,
  };
  const entries = Object.entries(safeChecks) as [keyof SecurityFeaturesCheck, boolean][];
  const passCount = entries.filter(([, v]) => v).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-foreground">
          {passCount}/{entries.length} Features Verified
        </span>
        <span
          className={cn(
            "font-black",
            passCount === entries.length
              ? "text-emerald-400"
              : passCount >= 3
              ? "text-amber-400"
              : "text-destructive"
          )}
        >
          {passCount === entries.length ? "ALL CLEAR" : passCount >= 3 ? "PARTIAL" : "FAILED"}
        </span>
      </div>

      {/* Segmented progress */}
      <div className="flex gap-1 h-1.5">
        {entries.map(([key, passed]) => (
          <div
            key={key}
            className={cn(
              "flex-1 rounded-full transition-all duration-500",
              passed ? "bg-emerald-500" : "bg-destructive/50"
            )}
          />
        ))}
      </div>

      {/* Feature rows */}
      <div className="grid grid-cols-1 gap-2">
        {entries.map(([key, passed]) => (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-all",
              passed
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-destructive/5 border-destructive/20"
            )}
          >
            <span
              className={cn(
                "font-semibold",
                passed ? "text-foreground" : "text-muted-foreground line-through"
              )}
            >
              {FEATURE_LABELS[key]}
            </span>
            <div
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                passed ? "bg-emerald-500/15" : "bg-destructive/15"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <X className="h-3 w-3 text-destructive" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default SecurityFeaturesGrid;
