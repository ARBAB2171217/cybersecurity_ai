"use client";

/**
 * AuthContext — Thin React context bridge for components that still
 * consume AuthContext directly (e.g. ProtectedLayout, Navbar).
 *
 * The real state lives in the Zustand auth store (`store/auth.store.ts`).
 * This provider simply bootstraps the store on mount and re-exports its values.
 */
import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { User, Admin } from "@/types";

interface AuthContextType {
  user: User | Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, login, logout, checkAuth } =
    useAuthStore();

  // Re-validate stored tokens on every app bootstrap
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for the global auth:expired event dispatched by the Axios interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
