"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { PermissionGrid } from "@/types/admin";

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionGrid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getPermissions();
        if (res.success && res.data) {
          setPermissions(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Permissions" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Role Access Matrix
        </h1>
        <p className="text-xs text-muted-foreground">
          View structural privileges, operation guards, and access flags for admin levels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privilege Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse font-semibold">
              Loading permissions directory...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System Role</TableHead>
                  <TableHead className="text-center">Manage Citizens</TableHead>
                  <TableHead className="text-center">Manage Administrators</TableHead>
                  <TableHead className="text-center">Delete Reports</TableHead>
                  <TableHead className="text-center">Audit Logs Access</TableHead>
                  <TableHead className="text-center">Settings Override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p) => (
                  <TableRow key={p.role}>
                    <TableCell>
                      <Badge variant={p.role === "SUPER_ADMIN" ? "success" : "default"}>
                        {p.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center w-full">
                        {p.canManageUsers ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center w-full">
                        {p.canManageAdmins ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center w-full">
                        {p.canDeleteReports ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center w-full">
                        {p.canViewAuditLogs ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex justify-center w-full">
                        {p.canEditSettings ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
