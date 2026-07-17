"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function UserAnalyticsPage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Analytics" },
  ];

  return (
    <PageContainer>
      <div className="space-y-2 mb-6">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Scan Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          Detailed metrics, threat distributions, and performance analytics for your scans.
        </p>
      </div>

      <AnalyticsDashboard />
    </PageContainer>
  );
}
