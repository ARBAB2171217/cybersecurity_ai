"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/");
      } else if (!("role" in user) || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !("role" in user) || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground font-semibold animate-pulse">Authenticating access clearance...</span>
      </div>
    );
  }

  return <ProtectedLayout>{children}</ProtectedLayout>;
}
