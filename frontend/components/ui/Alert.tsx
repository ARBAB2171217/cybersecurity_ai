import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success";
  title?: string;
}

export function Alert({ className, variant = "default", title, children, ...props }: AlertProps) {
  const variantStyles = {
    default: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  const icons = {
    default: <Info className="h-4 w-4" />,
    destructive: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 flex gap-3 text-xs leading-relaxed font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex flex-col gap-0.5">
        {title && <h5 className="font-bold tracking-tight text-foreground text-sm">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
export default Alert;
