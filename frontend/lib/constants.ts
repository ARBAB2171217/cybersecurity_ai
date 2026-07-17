const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const API_URL = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api/v1`;
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CyberShield Currency AI";

// Valid Indian Rupee banknote values matching backend validators
export const VALID_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 2000] as const;

export type Denomination = typeof VALID_DENOMINATIONS[number];

// Frontend route definitions for clean navigation mapping
export const ROUTES = {
  HOME: "/",
  LOGIN: "/?auth=login",
  REGISTER: "/?auth=register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  
  // Authenticated user routes
  DASHBOARD: "/dashboard",
  DETECT: "/detect-note", // Universal AI Scanner
  URL_INTELLIGENCE: "/url-intelligence",
  REPORTS: "/reports",
  REPORT_DETAIL: (id: string) => `/report/${id}`,
  DETECTION_RESULT: (id: string) => `/detection-result/${id}`,
  COMMUNITY: "/community",
  COMMUNITY_DETAIL: (id: string) => `/community/${id}`,
  BOOKMARKS: "/bookmarks",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  NOTIFICATIONS: "/notifications",
  ANALYTICS: "/analytics",
  
  // Administrative routes
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    ADMINS: "/admin/admins",
    REPORTS: "/admin/reports",
    ANALYTICS: "/admin/analytics",
    AUDIT_LOGS: "/admin/audit-logs",
  }
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "cybershield_access_token",
  REFRESH_TOKEN: "cybershield_refresh_token",
  THEME: "cybershield_theme",
} as const;
