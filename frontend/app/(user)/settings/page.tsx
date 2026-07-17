"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SecuritySettingsForm } from "@/components/settings/SecuritySettingsForm";

export default function SettingsPage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings" },
  ];

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Security Configuration
        </h1>
        <p className="text-xs text-muted-foreground">
          Modify passwords and review active session parameters.
        </p>
      </div>

      <SecuritySettingsForm />
    </PageContainer>
  );
}
