import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

interface LoadingComponentsProps {
  stage: "validating" | "resolving" | "parsing" | "analyzing";
}

const STAGES = [
  { id: "validation", label: "URL Validation" },
  { id: "normalization", label: "Canonical Normalization" },
  { id: "parsing", label: "Structural Component Parsing" },
  { id: "redirects", label: "Programmatic Redirect Tracing" },
  { id: "rules", label: "Security Rule Auditing" },
  { id: "domain", label: "Brand Spoof & Similarity Check" },
  { id: "ai", label: "Gemini AI Threat Classification" }
];

export function LoadingComponents({ stage }: LoadingComponentsProps) {
  const getActiveIndex = () => {
    switch (stage) {
      case "validating": return 1;
      case "resolving": return 3;
      case "parsing": return 5;
      case "analyzing": return 6;
      default: return 0;
    }
  };

  const activeIdx = getActiveIndex();

  return (
    <div className="space-y-6 animate-pulse">
      {/* Overview Skeleton */}
      <Card className="bg-zinc-950/20 border-border/40">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3 w-full md:w-2/3">
            <div className="h-2.5 bg-zinc-800 rounded-full w-24" />
            <div className="h-4 bg-zinc-800 rounded-full w-3/4" />
            <div className="h-2.5 bg-zinc-800 rounded-full w-1/2" />
          </div>
          <div className="h-16 w-16 bg-zinc-800 rounded-full shrink-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Tracker */}
        <Card className="bg-zinc-950/20 border-border/40 lg:col-span-1">
          <CardContent className="p-5 space-y-4">
            <div className="h-3 bg-zinc-800 rounded-full w-1/3" />
            <div className="space-y-3.5 relative pl-4 border-l border-zinc-800/80">
              {STAGES.map((s, idx) => {
                const isActive = idx === activeIdx;
                const isCompleted = idx < activeIdx;
                return (
                  <div key={s.id} className="relative flex items-center gap-3">
                    <span
                      className={`absolute -left-[21px] h-2.5 w-2.5 rounded-full border-2 ${
                        isActive
                          ? "bg-indigo-500 border-indigo-500 scale-125 animate-ping"
                          : isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-zinc-900 border-zinc-800"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-indigo-400"
                          : isCompleted
                          ? "text-emerald-400"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Skeletons */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-950/20 border-border/40">
            <CardContent className="p-6 space-y-4">
              <div className="h-3 bg-zinc-800 rounded-full w-1/4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-zinc-900/60 border border-border/10 rounded-lg" />
                <div className="h-10 bg-zinc-900/60 border border-border/10 rounded-lg" />
                <div className="h-10 bg-zinc-900/60 border border-border/10 rounded-lg col-span-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/20 border-border/40">
            <CardContent className="p-6 space-y-3">
              <div className="h-3 bg-zinc-800 rounded-full w-1/3" />
              <div className="h-2 bg-zinc-900 rounded-full w-full" />
              <div className="h-2 bg-zinc-900 rounded-full w-5/6" />
              <div className="h-2 bg-zinc-900 rounded-full w-4/5" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
