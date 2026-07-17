"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { resolveRole } from "@/utils/permissions";
import { getDefaultRedirect } from "@/utils/routes";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginAdmin(data);

      if (response.success && response.data) {
        await login(response.data.access_token, response.data.refresh_token);
        
        const updatedUser = useAuthStore.getState().user;
        const userRole = resolveRole(updatedUser);
        window.location.href = getDefaultRedirect(userRole);
      } else {
        setError(response.message || "Authentication failed.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to authenticate.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      
      <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-950/80 backdrop-blur-sm border border-border/40 shadow-2xl relative overflow-hidden">
        {/* Top running gradient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Administrator Portal</h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
            Access administrative system nodes and analytical reports
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@agency.gov.in"
              {...register("email")}
              className="w-full h-10 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
            />
            {errors.email && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full h-10 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
            />
            {errors.password && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Authorize Session
          </Button>
        </form>
      </div>
    </div>
  );
}
