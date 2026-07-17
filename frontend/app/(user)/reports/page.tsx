"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ReportsTable } from "@/components/reports/ReportsTable";

export default function ReportsHistoryPage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports" },
  ];

  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Incident Reports History
        </h1>
        <p className="text-xs text-muted-foreground">
          Track audit catalogs of classifications, denominations, and verification statuses.
        </p>
      </div>

      <ReportsTable />
    </PageContainer>
  );
}
