"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception to local telemetry
    console.error("Runtime exception captured:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-bounce">
        <AlertOctagon className="h-8 w-8" />
      </div>
      
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        System Fault Detected
      </h1>
      
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        An isolated runtime error occurred in the browser process. Safe state telemetry logs have been updated.
      </p>

      <div className="mt-4 p-4 bg-zinc-950 border border-red-500 rounded text-left max-w-2xl overflow-auto text-xs font-mono text-red-400">
        <p><b>Error:</b> {error.message}</p>
        {error.stack && <pre className="mt-2">{error.stack}</pre>}
      </div>
      
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Reinitialize Secure Client
      </button>
    </div>
  );
}
