import Link from "next/link";
import { Compass } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Icon frame */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse-slow">
        <Compass className="h-8 w-8" />
      </div>
      
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Boundary Exceeded
      </h1>
      
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The requested path does not exist or has been moved outside this secure network sector.
      </p>
      
      <Link
        href={ROUTES.HOME}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Return to Safe Perimeter
      </Link>
    </div>
  );
}
