"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { UserManagementTable } from "@/components/admin/UserManagementTable";

export default function AdminUsersPage() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Citizens" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Citizen Directory
        </h1>
        <p className="text-xs text-muted-foreground">
          View, audit, and toggle login access controls for registered citizen accounts.
        </p>
      </div>

      <UserManagementTable />
    </PageContainer>
  );
}
