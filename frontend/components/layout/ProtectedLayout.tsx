"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { ROUTES } from "@/lib/constants";

export interface ProtectedLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedLayout({ children, requireAdmin = false }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN);
      } else if (requireAdmin && !isAdmin) {
        router.replace(ROUTES.DASHBOARD);
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-grow flex flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
export default ProtectedLayout;
