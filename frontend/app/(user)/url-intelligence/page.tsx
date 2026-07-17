"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { URLIntelligence } from "@/components/dashboard/URLIntelligence";

export default function URLIntelligencePage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "URL Intelligence" },
  ];

  return (
    <PageContainer>
      <div className="space-y-2 mb-6">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          URL Threat Intelligence
        </h1>
        <p className="text-xs text-muted-foreground">
          Analyze suspicious links, trace redirects, and identify phishing threats safely without executing them.
        </p>
      </div>

      <URLIntelligence />
    </PageContainer>
  );
}
