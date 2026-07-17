import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/10 border border-primary/20 text-primary",
    secondary: "bg-secondary/40 border border-border text-foreground",
    destructive: "bg-destructive/10 border border-destructive/20 text-destructive",
    outline: "border border-border text-foreground",
    success: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
export default Badge;
