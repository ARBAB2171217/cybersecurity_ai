import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoDataProps {
  message?: string;
  className?: string;
}

export function NoData({ message = "No records found.", className }: NoDataProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center text-muted-foreground", className)}>
      <Database className="h-6 w-6 mb-2 opacity-40" />
      <span className="text-xs font-semibold">{message}</span>
    </div>
  );
}
export default NoData;
