import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/axios";
import { STORAGE_KEYS } from "@/lib/constants";
import { resolveRole, type AppRole } from "@/utils/permissions";
import authService from "@/services/auth.service";
import type { User, Admin } from "@/types";

// ─── State Shape ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: AppRole | null;
  hydrated: boolean;
}

interface AuthActions {
  /** Called after a successful login — stores tokens, loads profile. */
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  /** Clears all session data. */
  logout: () => void;
  /** Re-validates the stored token and refreshes user data. */
  checkAuth: () => Promise<void>;
  /** Syncs user profile updates into the store. */
  setUser: (user: User | Admin) => void;
  clearError: () => void;
  setHydrated: (hydrated: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns true only for errors that definitively mean the token is invalid
 * and the user must re-authenticate (HTTP 401 Unauthorized).
 *
 * IMPORTANT: Do NOT logout on:
 *  - 429 Too Many Requests   → rate limit; token is still valid
 *  - 403 Forbidden           → permission issue; token is still valid
 *  - 500 / 502 / 503         → server-side error; token is still valid
 *  - Network errors (no response) → connectivity issue; token is still valid
 */
function isDefinitiveAuthFailure(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "isAxiosError" in err &&
    (err as any).isAxiosError === true
  ) {
    const status: number | undefined = (err as any).response?.status;
    // Only 401 means the token is actually invalid/expired
    return status === 401;
  }
  return false;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ── Initial State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      role: null,
      hydrated: false,

      // ── Actions
      login: async (accessToken, refreshToken) => {
        set({ isLoading: true, error: null });

        // Persist tokens to localStorage and set Axios default header
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          // Set access token in cookies for Next.js middleware (valid for 7 days)
          document.cookie = `cybershield_access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        try {
          const res = await authService.getProfile();
          if (res.success && res.data) {
            const user = res.data as User | Admin;
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              role: resolveRole(user),
              isLoading: false,
            });
          } else {
            throw new Error(res.message || "Failed to load profile.");
          }
        } catch (err: any) {
          get().logout();
          set({ error: err.message || "Authentication failed.", isLoading: false });
          throw err;
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          // Clear access token cookie for Next.js middleware
          document.cookie = "cybershield_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        }
        delete api.defaults.headers.common.Authorization;
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token =
          get().accessToken ??
          (typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
            : null);

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        if (typeof window !== "undefined") {
          document.cookie = `cybershield_access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }

        set({ isLoading: true });
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        try {
          const res = await authService.getProfile();
          if (res.success && res.data) {
            const user = res.data as User | Admin;
            set({
              user,
              accessToken: token,
              isAuthenticated: true,
              role: resolveRole(user),
              isLoading: false,
            });
          } else {
            // Backend responded but indicated failure — treat as expired token
            get().logout();
          }
        } catch (err: unknown) {
          // Bug fix: previously called logout() on ANY error including 429.
          // Now we only logout on definitive 401 Unauthorized responses.
          // A 429 (rate limit), 500 (server error), or network error does NOT
          // mean the token is invalid — the user is still logged in.
          if (isDefinitiveAuthFailure(err)) {
            get().logout();
          } else {
            // For non-401 errors: keep the existing session intact.
            // The user stays authenticated; the error is transient.
            const status = (err as any)?.response?.status;
            if (status === 429) {
              console.warn(
                "[checkAuth] Rate-limited (429) — keeping session alive. Will retry on next navigation."
              );
            } else {
              console.warn(
                "[checkAuth] Transient error during profile fetch (status:",
                status ?? "network",
                ") — keeping session alive."
              );
            }
            // Still mark loading as done so the UI renders
            set({ isLoading: false });
          }
        }
      },

      setUser: (user) => {
        set({ user, role: resolveRole(user) });
      },

      clearError: () => set({ error: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "cybershield-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as any)
      ),
      // Only persist tokens — user is re-fetched on mount
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
