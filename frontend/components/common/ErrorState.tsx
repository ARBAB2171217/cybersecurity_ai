import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Handshake Error Encountered",
  description = "A connection timeout or protocol mismatch occurred while query-fetching backend modules.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass border border-destructive/20 rounded-2xl max-w-md mx-auto my-8">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-5 text-xs inline-flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" /> Retry Operation
        </Button>
      )}
    </div>
  );
}
export default ErrorState;
