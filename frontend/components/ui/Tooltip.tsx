"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-[10px] font-semibold text-foreground bg-zinc-950 border border-border/40 rounded shadow-md -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
            className
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
export default Tooltip;
