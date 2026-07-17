import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { SecurityRule } from "@/types/intelligence";

interface SecurityCheckListProps {
  passedChecks: SecurityRule[];
  failedChecks: SecurityRule[];
  warningChecks: SecurityRule[];
}

export function SecurityCheckList({
  passedChecks,
  failedChecks,
  warningChecks
}: SecurityCheckListProps) {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  const triggered = [...failedChecks, ...warningChecks];

  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" /> Security Rule Diagnostics ({triggered.length} Flags)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        {/* Severity Metrics Panel */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-900/20 border border-border/20 rounded-lg p-3 text-center text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Passed Checks</span>
            <span className="text-sm font-black text-emerald-400">{passedChecks.length}</span>
          </div>
          <div className="border-x border-border/10">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Warnings</span>
            <span className="text-sm font-black text-amber-400">{warningChecks.length}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Failed Checks</span>
            <span className="text-sm font-black text-destructive">{failedChecks.length}</span>
          </div>
        </div>

        {/* Failed & Warning rules */}
        <div className="space-y-2.5">
          {triggered.length === 0 ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center space-y-1">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-emerald-400">Zero Flags Tripped</p>
              <p className="text-[10px] text-muted-foreground">The URL successfully passed all rule-based checks.</p>
            </div>
          ) : (
            triggered.map((rule, idx) => {
              const ruleId = `triggered-${idx}`;
              const isExpanded = expandedIndex === ruleId;
              const isFail = rule.status === "Fail";

              return (
                <div
                  key={ruleId}
                  className={`border rounded-lg text-xs transition-colors overflow-hidden ${
                    isFail
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-amber-500/5 border-amber-500/20"
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(ruleId)}
                    className="w-full text-left p-3 flex justify-between items-center focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <span className="font-bold text-foreground flex items-center gap-2">
                      {isFail ? (
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      {rule.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[8px] font-bold uppercase tracking-wider ${
                          isFail
                            ? "border-destructive text-destructive bg-destructive/10"
                            : "border-amber-500 text-amber-500 bg-amber-500/10"
                        }`}
                      >
                        {rule.severity}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-border/5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.reason}</p>
                      <div className="p-2.5 rounded bg-zinc-950/40 border border-border/10 text-[10px] text-foreground flex items-start gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-indigo-400">Action:</strong> {rule.suggestedAction}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
