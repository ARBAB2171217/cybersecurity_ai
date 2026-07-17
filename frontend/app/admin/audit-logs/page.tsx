"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AuditLogsTable } from "@/components/admin/AuditLogsTable";

export default function AdminAuditLogsPage() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Audit Logs" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Security Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Track access control events, database status modifications, and admin actions logs.
        </p>
      </div>

      <AuditLogsTable />
    </PageContainer>
  );
}
