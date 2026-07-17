import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldX, ChevronDown, ChevronUp } from "lucide-react";
import { RedirectChain } from "@/utils/urlRulesEngine";

interface RedirectTimelineProps {
  redirectData: RedirectChain | null;
}

export function RedirectTimeline({ redirectData }: RedirectTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (!redirectData) return null;

  const totalSteps = redirectData.redirect_chain.length;
  const showHopsLimit = 2;
  const needsTruncation = totalSteps > showHopsLimit;
  
  // Decide which steps to show based on expansion state
  const visibleSteps = expanded || !needsTruncation
    ? redirectData.redirect_chain
    : [
        redirectData.redirect_chain[0],
        // if more than 2 steps, show the last step as step 2, wrapping others in between
        redirectData.redirect_chain[totalSteps - 1]
      ];

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (code >= 300 && code < 400) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Redirect Timeline & Chains
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        {redirectData.error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <ShieldX className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Redirect Flow Halted</span>
              <p className="text-[11px] text-destructive/80 leading-relaxed">{redirectData.error}</p>
            </div>
          </div>
        )}

        <div className="relative border-l border-border/30 pl-5 ml-2.5 space-y-4 pt-1">
          {/* Step list */}
          {visibleSteps.map((step, idx) => {
            // Determine actual step index
            const isLastVisibleItem = idx === visibleSteps.length - 1;
            const actualIdx = !expanded && needsTruncation && isLastVisibleItem
              ? totalSteps - 1
              : idx;

            return (
              <React.Fragment key={actualIdx}>
                {/* Visual indicator for collapsed middle steps */}
                {!expanded && needsTruncation && idx === 1 && totalSteps > 2 && (
                  <div className="relative pl-1 py-1 text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                    <span className="absolute -left-[28px] h-4 w-4 flex items-center justify-center text-zinc-500">⋮</span>
                    <span>[{totalSteps - 2} middle redirect hops hidden]</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      onClick={() => setExpanded(true)}
                    >
                      Show All
                    </Button>
                  </div>
                )}

                <div className="relative group">
                  <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-indigo-500 group-hover:bg-indigo-400 transition-colors" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">Step #{actualIdx + 1}</span>
                      <Badge variant="outline" className={`text-[8px] font-bold uppercase ${getStatusBadge(step.status_code)}`}>
                        HTTP {step.status_code || "Unknown"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold font-mono truncate max-w-[200px] sm:max-w-sm">
                        {step.hostname}
                      </span>
                    </div>
                    <p className="font-mono text-foreground break-all select-all font-medium">
                      {step.url}
                    </p>
                    <div className="flex gap-4 text-[9px] text-muted-foreground pt-0.5">
                      <span>Server: <strong className="text-zinc-400">{step.server || "unknown"}</strong></span>
                      <span>Content-Type: <strong className="text-zinc-400">{step.content_type || "unknown"}</strong></span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          {/* Final destination */}
          <div className="relative group">
            <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-500" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 font-mono">FINAL DESTINATION</span>
                <Badge variant="outline" className="text-[8px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Resolved
                </Badge>
              </div>
              <p className="font-mono text-emerald-400 break-all select-all font-semibold">
                {redirectData.final_url}
              </p>
            </div>
          </div>
        </div>

        {needsTruncation && (
          <div className="pt-2 border-t border-border/5 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Collapse Chain</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Expand All ({totalSteps} steps)</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
