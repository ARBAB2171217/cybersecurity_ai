"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { useEffect } from "react";

export function AdminManagementTable() {
  const { admins, adminsPages, adminFilters, setAdminFilters, fetchAdmins, isLoading } = useAdmin();

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSearchChange = (val: string) => {
    setAdminFilters((prev) => ({ ...prev, search: val || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setAdminFilters((prev) => ({ ...prev, page }));
  };

  const safeAdmins = admins ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-zinc-950/20 p-4 rounded-xl border border-border/40">
        <div className="flex-grow">
          <SearchBar
            value={adminFilters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search administrators by name or email..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10">
          <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading administrative directory...</span>
        </div>
      ) : safeAdmins.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10 text-center p-6">
          <span className="text-xs font-semibold text-muted-foreground">No administrators found.</span>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Administrative Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeAdmins.map((adm) => (
                <TableRow key={adm.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">#{adm.id}</TableCell>
                  <TableCell className="font-bold text-foreground">{adm.fullName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{adm.email}</TableCell>
                  <TableCell>
                    <Badge variant={adm.role === "SUPER_ADMIN" ? "success" : "default"}>
                      {adm.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={adm.isActive ? "success" : "destructive"}>
                      {adm.isActive ? "ACTIVE" : "BLOCKED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(adm.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={adminFilters.page || 1}
            totalPages={adminsPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
export default AdminManagementTable;
