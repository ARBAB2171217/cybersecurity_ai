"use client";

import { cn } from "@/lib/utils";
import type { DetectionResult } from "@/types/detection";
import { Download, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportActionsProps {
  result: DetectionResult;
  reportId: string;
  className?: string;
}

function buildJsonBlob(result: DetectionResult): string {
  const exportData = {
    report_id: result.reportId,
    generated_at: new Date().toISOString(),
    verdict: result.isCounterfeit ? "COUNTERFEIT" : "GENUINE",
    denomination: result.denomination,
    serial_number: result.serialNumber,
    confidence_score: result.confidenceScore,
    risk_score: result.riskScore,
    security_checks: result.securityCheck,
    ocr_serial: result.serialNumber,
    model_version: result.modelVersion,
    processing_time_ms: result.processingTimeMs,
    timestamp: result.timestamp,
  };
  return JSON.stringify(exportData, null, 2);
}

export function ReportActions({ result, reportId, className }: ReportActionsProps) {
  const handleDownloadJson = () => {
    const blob = new Blob([buildJsonBlob(result)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cybershield-report-${reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    // PDF generation would require jspdf or server-side rendering in production.
    // For Phase 7 we trigger the browser print dialog as a PDF-equivalent.
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `CyberShield Detection Report #${reportId}`,
      text: `AI currency verification result: ${result.isCounterfeit ? "COUNTERFEIT DETECTED" : "GENUINE NOTE"}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or unsupported
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert("Report URL copied to clipboard.");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadJson}
        className="flex items-center gap-1.5 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Export JSON
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        className="flex items-center gap-1.5 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Save PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-1.5 text-xs"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="flex items-center gap-1.5 text-xs print:hidden"
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </Button>
    </div>
  );
}
export default ReportActions;
