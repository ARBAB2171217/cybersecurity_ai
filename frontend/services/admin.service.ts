import { api } from "@/lib/axios";
import type { ApiResponse, PaginationParams } from "./api";
import type { User, Admin, Report } from "@/types";
import type {
  PaginatedUsers,
  PaginatedAdmins,
  PaginatedAuditLogs,
  AuditLogFilter,
  UserManagementFilter,
  PermissionGrid,
} from "@/types/admin";

// ─── Admin Service ────────────────────────────────────────────────────────

export const adminService = {
  // ── User Management ──────────────────────────────────────────────────

  /**
   * Fetches a paginated list of all registered citizen users.
   */
  async getUsers(
    filters: UserManagementFilter = {}
  ): Promise<ApiResponse<PaginatedUsers>> {
    const res = await api.get<ApiResponse<PaginatedUsers>>("/admin/users", {
      params: filters,
    });
    if (res.data && res.data.success && res.data.data && res.data.data.users) {
      res.data.data.users = res.data.data.users.map((raw: any) => ({
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        isVerified: raw.is_verified !== undefined ? raw.is_verified : raw.isVerified,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      }));
    }
    return res.data;
  },

  /**
   * Fetches a single citizen user by ID.
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    if (res.data && res.data.success && res.data.data) {
      const raw = res.data.data as any;
      res.data.data = {
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        isVerified: raw.is_verified !== undefined ? raw.is_verified : raw.isVerified,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      } as any;
    }
    return res.data;
  },

  /**
   * Toggles a citizen's isActive status.
   */
  async updateUserStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<User>> {
    const res = await api.put<ApiResponse<User>>(`/admin/users/${id}/status`, {
      is_active: isActive,
    });
    if (res.data && res.data.success && res.data.data) {
      const raw = res.data.data as any;
      res.data.data = {
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        isVerified: raw.is_verified !== undefined ? raw.is_verified : raw.isVerified,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      } as any;
    }
    return res.data;
  },

  // ── Admin Management ─────────────────────────────────────────────────

  /**
   * Fetches a paginated list of all admins.
   */
  async getAdmins(
    filters: UserManagementFilter = {}
  ): Promise<ApiResponse<PaginatedAdmins>> {
    const res = await api.get<ApiResponse<PaginatedAdmins>>("/admin/admins", {
      params: filters,
    });
    if (res.data && res.data.success && res.data.data && res.data.data.admins) {
      res.data.data.admins = res.data.data.admins.map((raw: any) => ({
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        role: raw.role,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      }));
    }
    return res.data;
  },

  /**
   * Fetches a single admin by ID (SUPER_ADMIN only).
   */
  async getAdminById(id: string): Promise<ApiResponse<Admin>> {
    const res = await api.get<ApiResponse<Admin>>(`/admin/admins/${id}`);
    if (res.data && res.data.success && res.data.data) {
      const raw = res.data.data as any;
      res.data.data = {
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        role: raw.role,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      } as any;
    }
    return res.data;
  },

  // ── Report Management ─────────────────────────────────────────────────

  /**
   * Fetches all reports with optional filtering.
   */
  async getAllReports(
    filters: PaginationParams & { status?: string } = {}
  ): Promise<ApiResponse<{ reports: Report[]; total: number; page: number; pages: number }>> {
    const res = await api.get<
      ApiResponse<{ reports: Report[]; total: number; page: number; pages: number }>
    >("/admin/reports", { params: filters });
    return res.data;
  },

  /**
   * Updates the review status of a report.
   */
  async updateReportStatus(
    id: string,
    status: "APPROVED" | "REJECTED"
  ): Promise<ApiResponse<Report>> {
    const res = await api.put<ApiResponse<Report>>(
      `/admin/reports/${id}/status`,
      { status }
    );
    return res.data;
  },

  /**
   * Hard-deletes a report (SUPER_ADMIN).
   */
  async deleteReport(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/admin/reports/${id}`);
    return res.data;
  },

  // ── Audit Logs ────────────────────────────────────────────────────────

  /**
   * Fetches a paginated audit trail.
   */
  async getAuditLogs(
    filters: AuditLogFilter = {}
  ): Promise<ApiResponse<PaginatedAuditLogs>> {
    const res = await api.get<ApiResponse<PaginatedAuditLogs>>(
      "/admin/audit-logs",
      { params: filters }
    );
    return res.data;
  },

  // ── Permissions ───────────────────────────────────────────────────────

  /**
   * Fetches the role-permission matrix.
   */
  async getPermissions(): Promise<ApiResponse<PermissionGrid[]>> {
    const res = await api.get<ApiResponse<PermissionGrid[]>>(
      "/admin/permissions"
    );
    return res.data;
  },
};

export default adminService;
