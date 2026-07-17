"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EvidenceUploader } from "@/components/upload/EvidenceUploader";

export default function DetectNotePage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "AI Smart Evidence" },
  ];

  return (
    <PageContainer>
      <div className="space-y-2 mb-6">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          AI Smart Evidence Analysis
        </h1>
        <p className="text-xs text-muted-foreground">
          Upload any evidence (Images, PDFs, Screenshots, URLs, or QR codes) and let the AI automatically determine the correct intelligence pipeline to analyze it.
        </p>
      </div>

      <EvidenceUploader />
    </PageContainer>
  );
}
