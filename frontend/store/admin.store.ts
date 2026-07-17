import { create } from "zustand";
import adminService from "@/services/admin.service";
import type { User, Admin, Report } from "@/types";
import type {
  AuditLogEntry,
  AuditLogFilter,
  UserManagementFilter,
  PaginatedUsers,
  PaginatedAdmins,
  PaginatedAuditLogs,
  PermissionGrid,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/errors";

interface AdminState {
  // Users
  users: User[];
  usersTotal: number;
  usersPage: number;
  usersPages: number;
  userFilters: UserManagementFilter;

  // Admins
  admins: Admin[];
  adminsTotal: number;
  adminsPage: number;
  adminsPages: number;
  adminFilters: UserManagementFilter;

  // All Reports (admin view)
  allReports: Report[];
  reportsTotal: number;
  reportsPage: number;
  reportsPages: number;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logsTotal: number;
  logsPage: number;
  logsPages: number;
  logFilters: AuditLogFilter;

  // Permissions
  permissions: PermissionGrid[];

  isLoading: boolean;
  error: string | null;
}

interface AdminActions {
  fetchUsers: (filters?: UserManagementFilter) => Promise<void>;
  fetchAdmins: (filters?: UserManagementFilter) => Promise<void>;
  fetchAllReports: (filters?: Record<string, unknown>) => Promise<void>;
  fetchAuditLogs: (filters?: AuditLogFilter) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  toggleUserStatus: (id: string, currentStatus: boolean) => Promise<void>;
  updateReportStatus: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  setUserFilters: (filters: UserManagementFilter) => void;
  setAdminFilters: (filters: UserManagementFilter) => void;
  setLogFilters: (filters: AuditLogFilter) => void;
  clearError: () => void;
}

export const useAdminStore = create<AdminState & AdminActions>()((set, get) => ({
  // ── State
  users: [],
  usersTotal: 0,
  usersPage: 1,
  usersPages: 1,
  userFilters: { page: 1, limit: 10 },

  admins: [],
  adminsTotal: 0,
  adminsPage: 1,
  adminsPages: 1,
  adminFilters: { page: 1, limit: 10 },

  allReports: [],
  reportsTotal: 0,
  reportsPage: 1,
  reportsPages: 1,

  auditLogs: [],
  logsTotal: 0,
  logsPage: 1,
  logsPages: 1,
  logFilters: { page: 1, limit: 15 },

  permissions: [],
  isLoading: false,
  error: null,

  // ── Actions
  fetchUsers: async (filters) => {
    const merged = { ...get().userFilters, ...filters };
    set({ isLoading: true, error: null, userFilters: merged });
    try {
      const res = await adminService.getUsers(merged);
      if (res.success && res.data) {
        set({
          users: res.data.users ?? [],
          usersTotal: res.data.total,
          usersPage: res.data.page,
          usersPages: res.data.pages,
        });
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdmins: async (filters) => {
    const merged = { ...get().adminFilters, ...filters };
    set({ isLoading: true, error: null, adminFilters: merged });
    try {
      const res = await adminService.getAdmins(merged);
      if (res.success && res.data) {
        set({
          admins: res.data.admins ?? [],
          adminsTotal: res.data.total,
          adminsPage: res.data.page,
          adminsPages: res.data.pages,
        });
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllReports: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await adminService.getAllReports(filters);
      if (res.success && res.data) {
        set({
          allReports: res.data.reports ?? [],
          reportsTotal: res.data.total,
          reportsPage: res.data.page,
          reportsPages: res.data.pages,
        });
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAuditLogs: async (filters) => {
    const merged = { ...get().logFilters, ...filters };
    set({ isLoading: true, error: null, logFilters: merged });
    try {
      const res = await adminService.getAuditLogs(merged);
      if (res.success && res.data) {
        set({
          auditLogs: res.data.logs ?? [],
          logsTotal: res.data.total,
          logsPage: res.data.page,
          logsPages: res.data.pages,
        });
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await adminService.getPermissions();
      if (res.success && res.data) set({ permissions: res.data ?? [] });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleUserStatus: async (id, currentStatus) => {
    // Optimistic update
    set((state) => ({
      users: (state.users ?? []).map((u) =>
        u.id === id ? { ...u, isActive: !currentStatus } : u
      ),
    }));
    try {
      await adminService.updateUserStatus(id, !currentStatus);
    } catch (err) {
      // Rollback
      set((state) => ({
        users: (state.users ?? []).map((u) =>
          u.id === id ? { ...u, isActive: currentStatus } : u
        ),
        error: getErrorMessage(err),
      }));
      throw err;
    }
  },

  updateReportStatus: async (id, status) => {
    try {
      const res = await adminService.updateReportStatus(id, status);
      if (res.success && res.data) {
        set((state) => ({
          allReports: (state.allReports ?? []).map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
      throw err;
    }
  },

  setUserFilters: (filters) =>
    set((state) => ({ userFilters: { ...state.userFilters, ...filters } })),
  setAdminFilters: (filters) =>
    set((state) => ({ adminFilters: { ...state.adminFilters, ...filters } })),
  setLogFilters: (filters) =>
    set((state) => ({ logFilters: { ...state.logFilters, ...filters } })),
  clearError: () => set({ error: null }),
}));
