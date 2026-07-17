import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Check } from "lucide-react";

interface ExplainabilityTimelineProps {
  hasRedirects: boolean;
  hasAi: boolean;
}

export function ExplainabilityTimeline({ hasRedirects, hasAi }: ExplainabilityTimelineProps) {
  const steps = [
    { label: "URL Submitted", status: "completed" },
    { label: "Validation Check", status: "completed" },
    { label: "Normalization", status: "completed" },
    { label: "Parsing Components", status: "completed" },
    { label: "Rule Engine Run", status: "completed" },
    { label: "Redirect Analysis", status: hasRedirects ? "completed" : "skipped" },
    { label: "Domain Intelligence", status: "completed" },
    { label: "AI Analysis", status: hasAi ? "completed" : "skipped" },
    { label: "Final Decision", status: "completed" }
  ];

  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Pipeline Audit Timeline
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="relative border-l border-border/20 ml-3 pl-6 space-y-4 py-1 text-xs">
          {steps.map((step, idx) => {
            const isSkipped = step.status === "skipped";
            return (
              <div key={idx} className="relative flex items-center justify-between">
                <span
                  className={`absolute -left-[31px] h-4 w-4 rounded-full flex items-center justify-center border ${
                    isSkipped
                      ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {!isSkipped && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className={`font-semibold ${isSkipped ? "text-muted-foreground/60" : "text-foreground"}`}>
                  {step.label}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[8px] font-bold uppercase py-0.5 tracking-wider ${
                    isSkipped
                      ? "border-zinc-800 text-zinc-500 bg-zinc-900/50"
                      : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                  }`}
                >
                  {isSkipped ? "Skipped" : "Completed"}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
