"use client";

import { cn } from "@/lib/utils";
import type { DetectionTimelineEvent } from "@/types/detection";
import { CheckCircle2, Clock } from "lucide-react";

interface DetectionTimelineProps {
  events: DetectionTimelineEvent[];
  className?: string;
}

export function DetectionTimeline({ events, className }: DetectionTimelineProps) {
  if (!events.length) return null;

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        return (
          <div key={idx} className="flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              <div className="h-6 w-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              </div>
              {!isLast && (
                <div className="flex-1 w-px bg-gradient-to-b from-primary/30 to-transparent mt-1 mb-1" />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-5 flex-1 min-w-0", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-foreground">{event.stage}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{event.durationMs}ms</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {event.description}
              </p>
              <span className="text-[9px] text-muted-foreground/60 font-mono">
                {new Date(event.completedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default DetectionTimeline;
