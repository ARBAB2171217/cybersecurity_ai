"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { Switch } from "@/components/ui/Switch";
import { useEffect } from "react";

export function UserManagementTable() {
  const { users, usersPages, userFilters, setUserFilters, fetchUsers, toggleUserStatus, isLoading } = useAdmin();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (val: string) => {
    setUserFilters((prev) => ({ ...prev, search: val || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setUserFilters((prev) => ({ ...prev, page }));
  };

  const safeUsers = users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-zinc-950/20 p-4 rounded-xl border border-border/40">
        <div className="flex-1">
          <SearchBar
            value={userFilters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search citizens by name or email..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10">
          <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading citizen directory...</span>
        </div>
      ) : safeUsers.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10 text-center p-6">
          <span className="text-xs font-semibold text-muted-foreground">No citizen users found.</span>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Citizen ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>OTP Verified</TableHead>
                <TableHead>Registered Date</TableHead>
                <TableHead className="text-right">Access Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">#{u.id}</TableCell>
                  <TableCell className="font-bold text-foreground">{u.fullName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "success" : "destructive"}>
                      {u.isActive ? "ACTIVE" : "BLOCKED"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isVerified ? "success" : "default"}>
                      {u.isVerified ? "VERIFIED" : "UNVERIFIED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                      <Switch
                        checked={u.isActive}
                        onChange={() => toggleUserStatus(u.id, u.isActive)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={userFilters.page || 1}
            totalPages={usersPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
export default UserManagementTable;
