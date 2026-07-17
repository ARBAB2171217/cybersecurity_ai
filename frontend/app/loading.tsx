export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Premium glowing spinner */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/10 border-t-primary" />
        <div className="absolute h-10 w-10 animate-pulse rounded-full bg-primary/20" />
        <div className="absolute h-4 w-4 rounded-full bg-primary" />
      </div>
      
      <p className="mt-6 text-sm font-medium tracking-wide text-muted-foreground animate-pulse-slow">
        Securing connection to CyberShield AI...
      </p>
    </div>
  );
}
