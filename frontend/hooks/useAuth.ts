import { useAuthStore } from "@/store/auth.store";
import { isAdmin, isSuperAdmin, hasPermission, type Permission } from "@/utils/permissions";

/**
 * Primary auth hook — reads from the Zustand auth store.
 * Provides role-aware helpers on top of raw store fields.
 */
export function useAuth() {
  const store = useAuthStore();
  const isVerifying = !!(store.accessToken && !store.user);
  const isLoading = !store.hydrated || store.isLoading || isVerifying;

  return {
    // ── Core store fields
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       isLoading,
    hydrated:        store.hydrated,
    error:           store.error,
    role:            store.role,

    // ── Store actions
    login:      store.login,
    logout:     store.logout,
    checkAuth:  store.checkAuth,
    setUser:    store.setUser,
    clearError: store.clearError,

    // ── Role helpers
    isAdmin:      isAdmin(store.user),
    isSuperAdmin: isSuperAdmin(store.user),

    // ── Permission checker
    can: (permission: Permission) => hasPermission(store.user, permission),
  };
}
