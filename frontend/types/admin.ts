import { User, Admin } from "./index";

export interface AuditLogEntry {
  id: string;
  adminId?: string;
  adminName?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface UserManagementFilter {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedAdmins {
  admins: Admin[];
  total: number;
  page: number;
  pages: number;
}

export interface AuditLogFilter {
  search?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pages: number;
}

export interface PermissionGrid {
  role: "ADMIN" | "SUPER_ADMIN";
  canManageUsers: boolean;
  canManageAdmins: boolean;
  canDeleteReports: boolean;
  canViewAuditLogs: boolean;
  canEditSettings: boolean;
}
