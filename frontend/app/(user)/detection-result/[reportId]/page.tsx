"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";

import { useDetectionStore } from "@/store/detection.store";
import {
  RefreshCcw,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Banknote,
  Cpu,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { Report, RawAiResponse } from "@/types";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { QRResultView } from "@/components/detection/QRResultView";
import { ScreenshotResultView } from "@/components/detection/ScreenshotResultView";

export default function DetectionResultPage() {
  const { reportId } = useParams() as { reportId: string };
  const { result, status, error, fetchResult } = useDetectionStore();

  useEffect(() => {
    if (!reportId) return;
    // Only fetch if we don't already have the matching result in store
    if (!result || result.id !== reportId) {
      fetchResult(reportId);
    }
  }, [reportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const breadcrumbItems = [
    { label: "Reports", href: ROUTES.REPORTS },
    { label: "Detection Result" },
  ];

  // ── Loading state
  if (status === "processing" || status === "uploading") {
    return (
      <PageContainer>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Cpu className="absolute inset-0 m-auto h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">AI Analysis Running</p>
            <p className="text-xs text-muted-foreground mt-1">
              Running OCR, denomination classification, and counterfeit detection...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Error state
  if (status === "error" || (!result && status !== "idle")) {
    return (
      <PageContainer>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Detection Result Not Found</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {error || "Unable to retrieve the analysis for this report."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchResult(reportId)}
              className="flex items-center gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <Link href={ROUTES.REPORTS}>
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Reports
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!result) return null;

  const report: Report = result;
  const ai = report.rawAiResponse as RawAiResponse | null | undefined;
  const isCounterfeit = report.isCounterfeit;
  const riskScore = ai?.risk_score ?? (isCounterfeit ? 85 : 15);
  const reasons = ai?.reasons ?? [];

  return (
    <PageContainer>
      {/* ── Header */}
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
              AI Detection Analysis
            </h1>
            <p className="text-xs text-muted-foreground">
              Report ID:{" "}
              <span className="font-mono font-semibold text-foreground">{report.id}</span>
              {" · "}
              <span>{new Date(report.createdAt).toLocaleString()}</span>
            </p>
          </div>
          <Badge
            variant={
              report.status === "APPROVED"
                ? "success"
                : report.status === "REJECTED"
                ? "destructive"
                : "default"
            }
          >
            {report.status}
          </Badge>
        </div>
      </div>

      {report.evidenceType === "QR" || report.evidenceType === "QR Code" || report.selectedPipeline === "QR" || (report.rawAiResponse?.qr_details) ? (
        <div className="mt-6">
          <QRResultView report={report} />
        </div>
      ) : report.evidenceType && report.evidenceType !== "Currency Note" && report.evidenceType !== "Currency" && report.selectedPipeline !== "Currency" ? (
        <div className="mt-6">
          <ScreenshotResultView report={report} />
        </div>
      ) : (
        <>
          {/* ── Verdict Hero Card */}
          <div
        className={`relative overflow-hidden rounded-2xl border p-6 flex items-center gap-5 ${
          isCounterfeit === true
            ? "bg-destructive/5 border-destructive/30"
            : isCounterfeit === false
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-amber-500/5 border-amber-500/30"
        }`}
      >
        <div
          className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${
            isCounterfeit === true
              ? "bg-destructive/20"
              : isCounterfeit === false
              ? "bg-emerald-500/20"
              : "bg-amber-500/20"
          }`}
        >
          {isCounterfeit === true ? (
            <ShieldAlert className="h-8 w-8 text-destructive" />
          ) : isCounterfeit === false ? (
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            AI Verdict
          </p>
          <p
            className={`text-2xl font-black tracking-tight ${
              isCounterfeit === true
                ? "text-destructive"
                : isCounterfeit === false
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {isCounterfeit === true
              ? "COUNTERFEIT DETECTED"
              : isCounterfeit === false
              ? "GENUINE NOTE"
              : "SUSPICIOUS — MANUAL REVIEW"}
          </p>
          {ai?.summary && (
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">{ai.summary}</p>
          )}
        </div>
      </div>

      {/* ── Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scores row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-6">
                <div className="relative h-28 w-28">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        isCounterfeit === false ? "#10b981" : isCounterfeit === true ? "#ef4444" : "#f59e0b"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${(report.confidenceScore ?? 0) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-foreground">
                    {Math.round((report.confidenceScore ?? 0) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">AI model confidence</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Risk Score</span>
                    <span className="font-black text-foreground">{riskScore.toFixed(0)}/100</span>
                  </div>
                  <div className="h-3 rounded-full bg-border/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        riskScore >= 70
                          ? "bg-destructive"
                          : riskScore >= 40
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  {[
                    { label: "Low Risk", range: "0–39", color: "bg-emerald-500" },
                    { label: "Moderate Risk", range: "40–69", color: "bg-amber-500" },
                    { label: "High Risk", range: "70–100", color: "bg-destructive" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                      <span className="text-muted-foreground">
                        {r.label} <span className="font-mono text-[10px]">({r.range})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Results */}
          {report.rawAiResponse?.qr_details && (
            <Card>
              <CardHeader>
                <CardTitle>QR Extraction Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/20 border border-border/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        QR Type
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {report.rawAiResponse.qr_details.qr_type}
                      </p>
                    </div>
                    <div className="bg-zinc-950/20 border border-border/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Decoded Value
                      </p>
                      <p className="text-xs font-mono bg-zinc-950/40 rounded p-1 overflow-x-auto whitespace-pre-wrap break-words">
                        {report.rawAiResponse.qr_details.decoded_value}
                      </p>
                    </div>
                  </div>

                  {report.rawAiResponse.qr_details.extracted_information && 
                   Object.keys(report.rawAiResponse.qr_details.extracted_information).length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
                        Extracted Information
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(report.rawAiResponse.qr_details.extracted_information).map(([key, value]) => (
                          <div key={key} className="bg-zinc-950/20 border border-border/20 rounded-lg p-2.5">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">
                              {key}
                            </p>
                            <p className="text-xs font-mono font-bold text-foreground break-words">
                              {value !== null && value !== undefined ? String(value) : "N/A"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.rawAiResponse.qr_details.validation_status === "INVALID" && (
                    <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-destructive mb-1">
                        Validation Errors
                      </p>
                      <ul className="list-disc pl-4 text-xs text-destructive/80 space-y-1">
                        {report.rawAiResponse.qr_details.validation_errors?.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Risk Analysis */}
          {report.rawAiResponse?.qr_details?.risk_analysis && (
            <Card>
              <CardHeader>
                <CardTitle>QR Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/20 border border-border/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Risk Level
                      </p>
                      <p className={`text-sm font-bold ${
                        report.rawAiResponse.qr_details.risk_analysis.risk_level === 'Critical' || report.rawAiResponse.qr_details.risk_analysis.risk_level === 'High' 
                          ? 'text-destructive' 
                          : report.rawAiResponse.qr_details.risk_analysis.risk_level === 'Medium' 
                          ? 'text-amber-500' 
                          : 'text-emerald-500'
                      }`}>
                        {report.rawAiResponse.qr_details.risk_analysis.risk_level}
                      </p>
                    </div>
                    <div className="bg-zinc-950/20 border border-border/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Risk Score
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {report.rawAiResponse.qr_details.risk_analysis.risk_score} / 100
                      </p>
                    </div>
                  </div>
                  
                  {report.rawAiResponse.qr_details.risk_analysis.analysis_summary && (
                    <div className="bg-zinc-950/20 border border-border/20 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Analysis Summary
                      </p>
                      <p className="text-sm text-foreground">
                        {report.rawAiResponse.qr_details.risk_analysis.analysis_summary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {report.rawAiResponse.qr_details.risk_analysis.passed_checks && report.rawAiResponse.qr_details.risk_analysis.passed_checks.length > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 mb-2">
                          Passed Checks
                        </p>
                        <ul className="list-disc pl-4 text-xs text-emerald-500/80 space-y-1">
                          {report.rawAiResponse.qr_details.risk_analysis.passed_checks.map((check: string, i: number) => (
                            <li key={i}>{check}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.rawAiResponse.qr_details.risk_analysis.detected_risks && report.rawAiResponse.qr_details.risk_analysis.detected_risks.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-destructive mb-2">
                          Detected Issues
                        </p>
                        <ul className="list-disc pl-4 text-xs text-destructive/80 space-y-1">
                          {report.rawAiResponse.qr_details.risk_analysis.detected_risks.map((risk: string, i: number) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* OCR Results */}
          {report.ocrText && (
            <Card>
              <CardHeader>
                <CardTitle>OCR Extraction Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                      Raw OCR Text
                    </p>
                    <pre className="text-xs text-foreground font-mono bg-zinc-950/40 border border-border/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                      {report.ocrText || "No text detected."}
                    </pre>
                  </div>
                  {ai?.ocr_data?.gemini_extracted && (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(ai.ocr_data.gemini_extracted)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-zinc-950/20 border border-border/20 rounded-lg p-2.5"
                          >
                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs font-mono font-bold text-foreground">{String(value)}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Findings */}
          {reasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCounterfeit ? "Anomaly Findings" : "Verification Notes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      {isCounterfeit ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant */}
          <AiAssistantPanel reportId={report.id} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Banknote image */}
          <Card>
            <CardHeader>
              <CardTitle>Banknote Image</CardTitle>
            </CardHeader>
            <CardContent>
              {report.imageUrl ? (
                <div className="relative w-full rounded-lg border border-border/20 overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}${report.imageUrl}`}
                    alt="Scanned banknote"
                    className="w-full h-auto block object-cover"
                  />
                  {ai?.feature_highlights?.map((highlight, idx) => {
                    const [ymin, xmin, ymax, xmax] = highlight?.box_2d || [0, 0, 0, 0];
                    if (ymin === 0 && xmin === 0 && ymax === 0 && xmax === 0) return null;
                    const top = ymin / 10;
                    const left = xmin / 10;
                    const height = (ymax - ymin) / 10;
                    const width = (xmax - xmin) / 10;
                    const isSuspicious = highlight.status.toLowerCase() === 'suspicious' || highlight.status.toLowerCase() === 'missing';
                    const color = isSuspicious ? 'border-destructive bg-destructive/20 text-destructive' : 'border-emerald-500 bg-emerald-500/20 text-emerald-500';
                    return (
                      <div
                        key={idx}
                        className={`absolute border-2 ${color} flex items-end`}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          height: `${height}%`,
                          width: `${width}%`,
                        }}
                      >
                        <span className={`text-[8px] font-bold px-1 rounded-sm -mb-4 bg-background ${color.split(' ')[0]}`}>{highlight.feature}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 rounded-lg border border-border/20 bg-zinc-950/20 flex items-center justify-center">
                  <Banknote className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendation */}
          {ai?.recommendation && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{ai.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Report Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Report Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-xs">
                {[
                  ["Report ID", report.id],
                  ["Denomination", `₹${report.denomination}`],
                  ["Serial Number", report.serialNumber ?? "N/A"],
                  ["Scanned At", new Date(report.createdAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-2 border-b border-border/10 pb-2 last:border-none last:pb-0"
                  >
                    <dt className="text-muted-foreground font-semibold shrink-0">{label}</dt>
                    <dd className="font-mono font-bold text-foreground text-right truncate">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Missing Features */}
          {ai?.missing_features && ai.missing_features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Missing Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ai.missing_features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detection Timeline */}
          {ai?.timeline && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4"/> Processing Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {Object.entries(ai.timeline).map(([step, duration], i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-2 rounded-lg border border-border/20 bg-zinc-950/20">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-foreground">{step}</span>
                          <span className="font-mono text-muted-foreground">{duration.toFixed(1)}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="space-y-3 print:hidden">
            <Button onClick={() => window.print()} className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <FileText className="h-4 w-4" />
              Export PDF Report
            </Button>
            <Link href={ROUTES.REPORTS} className="block">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View All Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </>
      )}
    </PageContainer>
  );
}
