"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, className, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border border-border/40 rounded-lg overflow-hidden glass", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-foreground hover:bg-white/5 transition-all focus:outline-none"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "transform rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-border/40 text-xs leading-relaxed text-muted-foreground bg-zinc-950/20">
          {children}
        </div>
      )}
    </div>
  );
}
