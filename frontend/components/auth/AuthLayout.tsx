import { Shield } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="w-full max-w-md p-6 rounded-2xl glass border border-border/40 shadow-2xl relative overflow-hidden">
      {/* Top running gradient highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}
export default AuthLayout;
