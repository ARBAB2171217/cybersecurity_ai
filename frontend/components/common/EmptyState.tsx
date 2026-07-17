import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No Resources Discovered",
  description = "No items matching query criteria are currently indexed in this security catalog node.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass border border-border/40 rounded-2xl max-w-md mx-auto my-8">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
        <FolderOpen className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 text-xs">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
export default EmptyState;
