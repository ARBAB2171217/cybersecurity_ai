import { ROUTES } from "@/lib/constants";
import { AppRole, ROLES } from "./permissions";

// ─── Public Routes ────────────────────────────────────────────────────────

/** Routes accessible without authentication */
export const PUBLIC_ROUTES: string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  "/(auth)/login",
  "/(auth)/register",
  "/(auth)/forgot-password",
  "/(auth)/reset-password",
  "/(auth)/verify-email",
];

/** Auth callback routes that accept token query params */
export const AUTH_CALLBACK_ROUTES: string[] = [
  ROUTES.VERIFY_EMAIL,
  ROUTES.RESET_PASSWORD,
  "/(auth)/verify-email",
  "/(auth)/reset-password",
];

// ─── Role → Default Redirect ──────────────────────────────────────────────

/** Where to redirect after a successful login based on role */
export const ROLE_REDIRECT_MAP: Record<AppRole, string> = {
  [ROLES.USER]:        ROUTES.DASHBOARD,
  [ROLES.ADMIN]:       ROUTES.ADMIN.DASHBOARD,
  [ROLES.SUPER_ADMIN]: ROUTES.ADMIN.DASHBOARD,
};

/** Where to send unauthenticated visitors */
export const UNAUTHENTICATED_REDIRECT = ROUTES.HOME;

/** Where to send authenticated users who lack the required role */
export const UNAUTHORIZED_REDIRECT = ROUTES.DASHBOARD;

// ─── Route Classification Helpers ────────────────────────────────────────

/**
 * Returns true when a pathname requires no authentication.
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}

/**
 * Returns true when the pathname is under /admin/*
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/**
 * Returns the default landing path for the given role after login.
 */
export function getDefaultRedirect(role: AppRole | null): string {
  if (!role) return UNAUTHENTICATED_REDIRECT;
  return ROLE_REDIRECT_MAP[role] ?? ROUTES.DASHBOARD;
}

/**
 * Returns true when the given role is allowed to access the given pathname.
 */
export function canAccessRoute(
  role: AppRole | null,
  pathname: string
): boolean {
  // Unauthenticated users may only access public routes
  if (!role) return isPublicRoute(pathname);

  // Admin routes require at least ADMIN role
  if (isAdminRoute(pathname)) {
    return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  }

  // All authenticated users can access non-admin routes
  return true;
}
