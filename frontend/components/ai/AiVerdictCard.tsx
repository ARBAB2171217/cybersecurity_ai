"use client";

import { cn } from "@/lib/utils";
import type { DetectionResult } from "@/types/detection";
import { ShieldCheck, ShieldAlert, Banknote, Calendar, Cpu, Hash, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AiVerdictCardProps {
  result: DetectionResult;
  className?: string;
}

export function AiVerdictCard({ result, className }: AiVerdictCardProps) {
  const isGenuine = !result.isCounterfeit;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden border",
        isGenuine
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-destructive/5 border-destructive/20",
        className
      )}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          isGenuine
            ? "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
            : "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
        )}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Icon */}
        <div
          className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0",
            isGenuine ? "bg-emerald-500/15" : "bg-destructive/15"
          )}
        >
          {isGenuine ? (
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-destructive" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={cn(
                "text-xl font-black tracking-tight",
                isGenuine ? "text-emerald-400" : "text-destructive"
              )}
            >
              {isGenuine ? "GENUINE NOTE — VERIFIED" : "COUNTERFEIT DETECTED"}
            </h2>
            <Badge variant={isGenuine ? "success" : "destructive"}>
              {result.isCounterfeit ? "FAKE" : "AUTHENTIC"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isGenuine
              ? "The submitted banknote has passed all AI security feature verifications. It is consistent with RBI printing specifications."
              : "Critical security feature mismatches detected. This note does not conform to Reserve Bank of India printing standards."}
          </p>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-5">
        {[
          { icon: Banknote, label: "Denomination",    value: `₹${result.denomination}` },
          { icon: Hash,     label: "Serial Number",   value: result.serialNumber || "N/A" },
          { icon: Calendar, label: "Scanned",         value: new Date(result.timestamp).toLocaleDateString() },
          { icon: Clock,    label: "Processing",      value: result.processingTimeMs ? `${result.processingTimeMs}ms` : "N/A" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                {label}
              </span>
              <span className="text-xs font-bold text-foreground font-mono">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model version */}
      {result.modelVersion && (
        <div className="relative mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Cpu className="h-3 w-3" />
          <span>Model: <span className="font-mono font-semibold text-foreground">{result.modelVersion}</span></span>
        </div>
      )}
    </div>
  );
}
export default AiVerdictCard;
