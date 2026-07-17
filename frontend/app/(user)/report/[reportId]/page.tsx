"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { reportService } from "@/services/report.service";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Report } from "@/types";
import { ShieldCheck, ShieldAlert, Calendar, Banknote, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRResultView } from "@/components/detection/QRResultView";

export default function ReportDetailPage() {
  const { reportId } = useParams() as { reportId: string };
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!reportId) return;
      try {
        const response = await reportService.getReportById(reportId);
        if (response.success && response.data) {
          setReport(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [reportId]);

  const breadcrumbItems = [
    { label: "Reports", href: "/reports" },
    { label: `Report #${reportId}` },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse font-semibold">
          Loading report diagnostics...
        </div>
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-xs text-muted-foreground font-semibold">
          Scan report not found.
        </div>
      </PageContainer>
    );
  }

  if (report.category === "QR Code") {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Breadcrumb items={breadcrumbItems} />
          <QRResultView report={report} isSavedReport={true} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
              Report Analysis #{report.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              Detailed audit summary of classified Indian Rupee banknote.
            </p>
          </div>
          <Badge variant={report.status === "APPROVED" ? "success" : report.status === "REJECTED" ? "destructive" : "default"}>
            {report.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Authenticity Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-zinc-950/40">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                report.isCounterfeit ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {report.isCounterfeit ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Verdict Output</span>
                <span className={`text-base font-black ${report.isCounterfeit ? "text-destructive" : "text-emerald-400"}`}>
                  {report.isCounterfeit ? "COUNTERFEIT (SUSPICIOUS NOTE)" : "GENUINE (PASS)"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-zinc-900/10">
                <Banknote className="h-5 w-5 text-primary" />
                <div className="text-xs">
                  <span className="text-muted-foreground block">Denomination</span>
                  <span className="font-bold text-foreground">₹{report.denomination}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-zinc-900/10">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-xs">
                  <span className="text-muted-foreground block">Scanned Date</span>
                  <span className="font-bold text-foreground">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/20 bg-zinc-900/5 text-xs space-y-2">
              <span className="font-bold text-foreground block">Forensic Notes</span>
              <p className="text-muted-foreground leading-relaxed">
                Optical character recognition (OCR) parsed the serial sequence as{" "}
                <span className="font-mono font-bold text-foreground">{report.serialNumber || "N/A"}</span>.
                Watermark features and micro-lettering outlines were classified as {report.isCounterfeit ? "inconsistent with standard currency prints." : "compliant with security features."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banknote Scan Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[2/1] sm:aspect-[3/1] lg:aspect-square w-full rounded-lg border border-border/40 bg-zinc-950 flex items-center justify-center text-xs text-muted-foreground">
              <Banknote className="h-10 w-10 opacity-30" />
            </div>
            {report.isCounterfeit && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-[10px] text-destructive flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This suspicious report has been logged. Counterfeiting is a punishable offence under IPC.
                </span>
              </div>
            )}
            <Button className="w-full text-xs" variant="outline">
              Download Audit PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
