import { User, Admin } from "@/types";

// ─── Role Definitions ─────────────────────────────────────────────────────

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

// ─── Permission Definitions ───────────────────────────────────────────────

export const PERMISSIONS = {
  // User-level permissions
  VIEW_OWN_REPORTS:    "view_own_reports",
  CREATE_REPORT:       "create_report",
  DELETE_OWN_REPORT:   "delete_own_report",
  UPDATE_OWN_PROFILE:  "update_own_profile",
  DETECT_CURRENCY:     "detect_currency",

  // Admin-level permissions
  VIEW_ALL_USERS:      "view_all_users",
  UPDATE_USER_STATUS:  "update_user_status",
  VIEW_ALL_REPORTS:    "view_all_reports",
  UPDATE_REPORT:       "update_report",
  DELETE_ANY_REPORT:   "delete_any_report",
  VIEW_AUDIT_LOGS:     "view_audit_logs",
  VIEW_ANALYTICS:      "view_analytics",

  // Super Admin only
  MANAGE_ADMINS:       "manage_admins",
  EDIT_SYSTEM_SETTINGS:"edit_system_settings",
  VIEW_PERMISSIONS:    "view_permissions",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─── Role → Permission Map ────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  USER: [
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.CREATE_REPORT,
    PERMISSIONS.DELETE_OWN_REPORT,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.DETECT_CURRENCY,
  ],
  ADMIN: [
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.CREATE_REPORT,
    PERMISSIONS.DELETE_OWN_REPORT,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.DETECT_CURRENCY,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.UPDATE_USER_STATUS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.UPDATE_REPORT,
    PERMISSIONS.DELETE_ANY_REPORT,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  SUPER_ADMIN: [
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.CREATE_REPORT,
    PERMISSIONS.DELETE_OWN_REPORT,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.DETECT_CURRENCY,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.UPDATE_USER_STATUS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.UPDATE_REPORT,
    PERMISSIONS.DELETE_ANY_REPORT,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.EDIT_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_PERMISSIONS,
  ],
};

// ─── Role Resolution ──────────────────────────────────────────────────────

/**
 * Determines a user's effective role. Citizens have no `role` field,
 * admins carry "ADMIN" | "SUPER_ADMIN".
 */
export function resolveRole(user: User | Admin | null): AppRole | null {
  if (!user) return null;
  if ("role" in user) return user.role as AppRole;
  return ROLES.USER;
}

// ─── Permission Checks ────────────────────────────────────────────────────

/**
 * Returns true if the given user has the specified permission.
 */
export function hasPermission(
  user: User | Admin | null,
  permission: Permission
): boolean {
  const role = resolveRole(user);
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Returns true if the given user has ALL of the specified permissions.
 */
export function hasAllPermissions(
  user: User | Admin | null,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Returns true if the given user has ANY of the specified permissions.
 */
export function hasAnyPermission(
  user: User | Admin | null,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Returns true if the user is an authenticated citizen (no admin role).
 */
export function isUser(user: User | Admin | null): user is User {
  return !!user && !("role" in user);
}

/**
 * Returns true if the user holds the ADMIN role.
 */
export function isAdmin(user: User | Admin | null): boolean {
  const role = resolveRole(user);
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Returns true if the user holds the SUPER_ADMIN role.
 */
export function isSuperAdmin(user: User | Admin | null): boolean {
  return resolveRole(user) === ROLES.SUPER_ADMIN;
}

/**
 * Returns all permissions the user currently holds.
 */
export function getUserPermissions(user: User | Admin | null): Permission[] {
  const role = resolveRole(user);
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}
