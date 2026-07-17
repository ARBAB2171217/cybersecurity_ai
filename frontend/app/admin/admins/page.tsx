"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AdminManagementTable } from "@/components/admin/AdminManagementTable";

export default function AdminDirectoryPage() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Administrators" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Administrators Directory
        </h1>
        <p className="text-xs text-muted-foreground">
          View administrative officers and audit system execution clearance roles.
        </p>
      </div>

      <AdminManagementTable />
    </PageContainer>
  );
}
