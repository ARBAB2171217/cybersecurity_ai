"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export default function NotificationsPage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Notifications" },
  ];

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          System Alerts Feed
        </h1>
        <p className="text-xs text-muted-foreground">
          Track alerts, scan classifications, and credential receipts.
        </p>
      </div>

      <NotificationsList />
    </PageContainer>
  );
}
