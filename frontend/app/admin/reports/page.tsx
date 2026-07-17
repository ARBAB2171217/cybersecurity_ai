"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ReportsTable } from "@/components/reports/ReportsTable";

export default function AdminReportsPage() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Reports Queue" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Reports Management Queue
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit incident scan reports logged by citizen users and modify status overrides.
        </p>
      </div>

      <ReportsTable />
    </PageContainer>
  );
}
