"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({ isOpen, onClose, title, children, side = "right", className }: DrawerProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideStyles = {
    right: "right-0 top-0 h-full w-full max-w-sm border-l border-border/40 transform translate-x-0",
    left: "left-0 top-0 h-full w-full max-w-sm border-r border-border/40 transform translate-x-0",
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "absolute bg-background/95 backdrop-blur-md p-6 shadow-2xl flex flex-col transition-transform duration-300",
          sideStyles[side],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {title && <h2 className="text-lg font-bold tracking-tight text-foreground mb-4">{title}</h2>}
        <div className="flex-grow overflow-y-auto mt-4">{children}</div>
      </div>
    </div>
  );
}
export default Drawer;
