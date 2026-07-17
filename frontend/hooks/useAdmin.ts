import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { User, Admin } from "@/types";
import { AuditLogEntry, AuditLogFilter, UserManagementFilter } from "@/types/admin";

export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPages, setUsersPages] = useState(1);
  const [adminsTotal, setAdminsTotal] = useState(0);
  const [adminsPages, setAdminsPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPages, setLogsPages] = useState(1);

  const [userFilters, setUserFilters] = useState<UserManagementFilter>({ page: 1, limit: 10 });
  const [adminFilters, setAdminFilters] = useState<UserManagementFilter>({ page: 1, limit: 10 });
  const [logFilters, setLogFilters] = useState<AuditLogFilter>({ page: 1, limit: 15 });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers(userFilters);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setUsersTotal(res.data.total);
        setUsersPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [userFilters]);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdmins(adminFilters);
      if (res.success && res.data) {
        setAdmins(res.data.admins);
        setAdminsTotal(res.data.total);
        setAdminsPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrators.");
    } finally {
      setIsLoading(false);
    }
  }, [adminFilters]);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs(logFilters);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs);
        setLogsTotal(res.data.total);
        setLogsPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [logFilters]);

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(id, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err: any) {
      throw new Error(err.message || "Failed to toggle user status.");
    }
  };

  return {
    users,
    admins,
    auditLogs,
    usersTotal,
    usersPages,
    adminsTotal,
    adminsPages,
    logsTotal,
    logsPages,
    userFilters,
    adminFilters,
    logFilters,
    isLoading,
    error,
    setUserFilters,
    setAdminFilters,
    setLogFilters,
    fetchUsers,
    fetchAdmins,
    fetchAuditLogs,
    toggleUserStatus,
  };
}
export default useAdmin;
