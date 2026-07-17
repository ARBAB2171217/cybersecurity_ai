"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "Analytics" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          System Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          System health telemetry, server metrics logs, and classification accuracy curves.
        </p>
      </div>

      <AnalyticsDashboard />
    </PageContainer>
  );
}
