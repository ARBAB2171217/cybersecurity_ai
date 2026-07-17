import { QueryClient } from "@tanstack/react-query";
import { getErrorMessage, isAuthError } from "@/utils/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Re-fetch on window focus in production; disabled for snappier DX
      refetchOnWindowFocus: false,

      // Retry once on transient failures; never retry auth failures
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false;
        return failureCount < 1;
      },

      // Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep inactive cache entries for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      // Do not retry mutations automatically
      retry: false,

      // Global mutation error handler — surfaces message for toast/store
      onError: (error) => {
        const message = getErrorMessage(error);
        console.error("[Mutation Error]", message);
      },
    },
  },
});

// ─── Cache Key Factories ──────────────────────────────────────────────────
// Centralising query keys avoids typos and enables easy invalidation.

export const QUERY_KEYS = {
  // Auth
  profile:       () => ["profile"] as const,

  // User
  notifications: () => ["notifications"] as const,

  // Reports
  reports:       (filters?: object) => ["reports", filters] as const,
  report:        (id: string)       => ["report", id] as const,

  // Admin
  allUsers:      (filters?: object) => ["admin", "users", filters] as const,
  allAdmins:     (filters?: object) => ["admin", "admins", filters] as const,
  allReports:    (filters?: object) => ["admin", "reports", filters] as const,
  auditLogs:     (filters?: object) => ["admin", "auditLogs", filters] as const,
  permissions:   ()                 => ["admin", "permissions"] as const,

  // Analytics
  analytics:     () => ["analytics"] as const,

  // Detection
  detection:     (id: string) => ["detection", id] as const,
} as const;
