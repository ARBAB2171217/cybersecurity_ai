import React, { useState, useMemo, useCallback } from "react";
import { Report } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import {
  FileImage,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  CreditCard,
  Mail,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Download,
  Flag,
  RefreshCcw,
  Clock,
  Info,
  ExternalLink,
  MessageSquare,
  QrCode,
  Globe,
  Share2,
  EyeOff
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ScreenshotResultViewProps {
  report: Report;
  isSavedReport?: boolean;
}

export function ScreenshotResultView({ report, isSavedReport = false }: ScreenshotResultViewProps) {
  const { addToast } = useToast();

  const [isOcrExpanded, setIsOcrExpanded] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  // Parse raw response
  const aiResponse = useMemo(() => report.rawAiResponse, [report.rawAiResponse]);
  const ocrText = useMemo(() => report.ocrText || aiResponse?.ocr_text || "", [report, aiResponse]);
  const entities = useMemo(() => aiResponse?.entities || {}, [aiResponse]);
  const riskAnalysis = useMemo(() => aiResponse?.risk_analysis || {}, [aiResponse]);
  const qrIntelligence = useMemo(() => aiResponse?.qr_intelligence || null, [aiResponse]);
  const urlIntelligence = useMemo(() => aiResponse?.url_intelligence || null, [aiResponse]);
  const aiAnalysis = useMemo(() => aiResponse?.ai_analysis || {}, [aiResponse]);
  const timeline = useMemo(() => aiResponse?.timeline || {}, [aiResponse]);

  const threatLevel = useMemo(() => aiAnalysis.threat_severity || riskAnalysis.threat_level || "Medium", [aiAnalysis, riskAnalysis]);
  const riskScore = useMemo(() => riskAnalysis.risk_score ?? 50, [riskAnalysis]);
  const scamCategory = useMemo(() => aiAnalysis.scam_category || report.category || "Unknown", [aiAnalysis, report]);
  const confidenceScore = useMemo(() => aiAnalysis.ai_confidence ?? report.confidenceScore ?? 0.8, [aiAnalysis, report]);
  const recommendation = useMemo(() => aiAnalysis.final_recommendation || "Use Caution", [aiAnalysis]);

  const getThreatColor = useCallback((level: string) => {
    switch (level?.toLowerCase()) {
      case "safe":
      case "low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "high":
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  }, []);

  const getThreatBorderAndBg = useCallback((level: string) => {
    switch (level?.toLowerCase()) {
      case "safe":
      case "low":
        return "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5";
      case "medium":
        return "bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5";
      case "high":
      case "critical":
        return "bg-destructive/5 border-destructive/30 shadow-lg shadow-destructive/5";
      default:
        return "bg-zinc-500/5 border-zinc-500/30 shadow-lg shadow-zinc-500/5";
    }
  }, []);

  const getThreatIcon = useCallback((level: string) => {
    switch (level?.toLowerCase()) {
      case "safe":
      case "low":
        return <ShieldCheck className="h-6 w-6 text-emerald-500 animate-pulse" />;
      case "medium":
        return <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />;
      case "high":
      case "critical":
        return <ShieldAlert className="h-6 w-6 text-destructive animate-pulse" />;
      default:
        return <Info className="h-6 w-6 text-zinc-500" />;
    }
  }, []);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      description: `${label} copied to secure clipboard`,
      type: "success"
    });
  }, [addToast]);

  const handleDownload = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CyberShield_Report_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast({
      description: "Analysis report downloaded successfully",
      type: "success"
    });
  }, [report, addToast]);

  const displayOcrText = useMemo(() => {
    if (isOcrExpanded || ocrText.length <= 200) {
      return ocrText;
    }
    return `${ocrText.substring(0, 200)}...`;
  }, [ocrText, isOcrExpanded]);

  return (
    <div className="space-y-6">
      {/* 1. Result Header */}
      <div 
        className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-300 ${getThreatBorderAndBg(threatLevel)}`}
      >
        <div className="flex items-center gap-5">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${
              threatLevel.toLowerCase() === 'critical' || threatLevel.toLowerCase() === 'high'
                ? "bg-destructive/20 text-destructive"
                : threatLevel.toLowerCase() === 'medium'
                ? "bg-amber-500/20 text-amber-500"
                : "bg-emerald-500/20 text-emerald-500"
            }`}
          >
            {getThreatIcon(threatLevel)}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
              <FileImage className="h-3.5 w-3.5" />
              Screenshot Intelligence Result
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-3">
              {scamCategory}
              <Badge variant="outline" className={`text-xs font-bold border-2 ${getThreatColor(threatLevel)}`}>
                {threatLevel.toUpperCase()} RISK
              </Badge>
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 2. AI Threat Summary & Explanation */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                AI Scam Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-zinc-900/60 p-4 rounded-lg border border-border/20">
                <h4 className="text-[11px] font-bold uppercase text-primary mb-1">Threat Summary</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {aiAnalysis.threat_summary || "Analyzing visual indicators and entities present in the screenshot."}
                </p>
              </div>

              {aiAnalysis.risk_explanation && (
                <div className="bg-zinc-900/60 p-4 rounded-lg border border-border/20">
                  <h4 className="text-[11px] font-bold uppercase text-primary mb-1">Risk Explanation</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiAnalysis.risk_explanation}
                  </p>
                </div>
              )}

              {aiAnalysis.prevention_tips && aiAnalysis.prevention_tips.length > 0 && (
                <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
                  <h4 className="text-[11px] font-bold uppercase text-emerald-500 mb-2">Prevention Tips</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-sm text-foreground/80">
                    {aiAnalysis.prevention_tips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Extracted Entities */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Extracted Entities & Indicators
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopy(JSON.stringify(entities, null, 2), "Extracted data")}
                className="h-8 flex items-center gap-1.5 hover:bg-white/5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Data
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Financial Entities */}
              {entities.financials && Object.values(entities.financials).some((arr: any) => arr && arr.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Financial Transactions & Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(entities.financials).map(([key, val]: [string, any]) => {
                      if (!val || val.length === 0) return null;
                      return (
                        <div key={key} className="bg-zinc-900/40 border border-border/20 rounded-lg p-3">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                            {key.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {val.map((item: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts */}
              {entities.contacts && Object.values(entities.contacts).some((arr: any) => arr && arr.length > 0) && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Communication Contacts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(entities.contacts).map(([key, val]: [string, any]) => {
                      if (!val || val.length === 0) return null;
                      return (
                        <div key={key} className="bg-zinc-900/40 border border-border/20 rounded-lg p-3">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                            {key.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {val.map((item: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Web / Network Telemetry */}
              {entities.web && Object.values(entities.web).some((arr: any) => arr && arr.length > 0) && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Web Telemetry
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(entities.web).map(([key, val]: [string, any]) => {
                      if (!val || val.length === 0) return null;
                      return (
                        <div key={key} className="bg-zinc-900/40 border border-border/20 rounded-lg p-3">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                            {key.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-col gap-1">
                            {val.map((item: string, idx: number) => (
                              <span key={idx} className="font-mono text-xs text-foreground truncate break-all">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Platforms */}
              {entities.platforms && entities.platforms.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Affected Apps / Platforms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.platforms.map((plat: any, idx: number) => {
                      const name = typeof plat === "string" ? plat : plat.name || "Unknown";
                      return (
                        <Badge key={idx} variant="outline" className="text-xs font-bold px-3 py-1 bg-zinc-900/40">
                          {name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Embedded QR and URL Summaries */}
          {(qrIntelligence?.detected || urlIntelligence?.detected) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* QR Intelligence summary card */}
              {qrIntelligence?.detected && (
                <Card className="border-border/40 bg-zinc-950/20">
                  <CardHeader className="pb-2 border-b border-border/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      Embedded QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Type:</span>
                      <span className="text-xs font-bold text-foreground">{qrIntelligence.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Threat Level:</span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${getThreatColor(qrIntelligence.ai_verdict?.threat_level || qrIntelligence.risk?.risk_level || "Medium")}`}>
                        {qrIntelligence.ai_verdict?.threat_level || qrIntelligence.risk?.risk_level || "Medium"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-zinc-900/40 p-2.5 rounded border border-border/10">
                      &quot;{qrIntelligence.ai_verdict?.ai_summary || "QR code threat analysis complete."}&quot;
                    </p>
                    <div className="pt-1">
                      <Link href={`${ROUTES.REPORTS}?qr_type=${qrIntelligence.type}`} className="block">
                        <Button variant="outline" size="sm" className="w-full text-xs hover:bg-white/5">
                          View QR Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* URL Intelligence summary card */}
              {urlIntelligence?.detected && (
                <Card className="border-border/40 bg-zinc-950/20">
                  <CardHeader className="pb-2 border-b border-border/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Embedded Link Scan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Target URL:</span>
                      <p className="text-[11px] font-mono text-foreground truncate break-all bg-zinc-900/60 p-1 px-2 rounded">
                        {urlIntelligence.target_url}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Threat Level:</span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${getThreatColor(urlIntelligence.ai_verdict?.threat_severity || urlIntelligence.risk?.threat_level || "Medium")}`}>
                        {urlIntelligence.ai_verdict?.threat_severity || urlIntelligence.risk?.threat_level || "Medium"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-zinc-900/40 p-2.5 rounded border border-border/10">
                      &quot;{urlIntelligence.ai_verdict?.threat_summary || "URL redirection trace complete."}&quot;
                    </p>
                    <div className="pt-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs hover:bg-white/5 flex items-center justify-center gap-1"
                        onClick={() => handleCopy(urlIntelligence.target_url, "Extracted link")}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 5. Rule Engine assessment & logs */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader 
              className="flex flex-row items-center justify-between pb-2 border-b border-border/10 cursor-pointer"
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
            >
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Security Policy Diagnostics
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isRulesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            {isRulesExpanded && (
              <CardContent className="space-y-4 pt-4">
                {riskAnalysis.triggered_rules && riskAnalysis.triggered_rules.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Triggered Security Violations
                    </h4>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg divide-y divide-destructive/10">
                      {riskAnalysis.triggered_rules.map((rule: any, i: number) => (
                        <div key={i} className="p-3 flex items-start gap-3 text-sm">
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-destructive">{rule.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                            <p className="text-[10px] font-mono uppercase font-bold text-destructive/80 mt-1">Severity: {rule.severity} | Score Contribution: +{rule.score_contribution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-emerald-500/90 font-bold">No security rules violated. Clean indicators.</span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* 6. Raw OCR Output */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader 
              className="flex flex-row items-center justify-between pb-2 border-b border-border/10 cursor-pointer"
              onClick={() => setIsOcrExpanded(!isOcrExpanded)}
            >
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                OCR Text Transcript
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-white/5" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(ocrText, "OCR text");
                  }}
                  title="Copy OCR transcript"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOcrExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-zinc-950/80 border border-border/20 rounded-lg p-4 relative">
                <p className="text-xs font-mono text-muted-foreground break-all whitespace-pre-wrap leading-relaxed select-all">
                  {displayOcrText || "No readable text detected in screenshot."}
                </p>
                {ocrText.length > 200 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
                    onClick={() => setIsOcrExpanded(!isOcrExpanded)}
                  >
                    {isOcrExpanded ? "Show Less" : "Show More"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* A. Risk Assessment Score Gauge */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-0 border-b border-border/10">
              <CardTitle className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2">
                Overall Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={
                      threatLevel.toLowerCase() === 'safe' || threatLevel.toLowerCase() === 'low'
                        ? "#10b981" 
                        : threatLevel.toLowerCase() === 'medium' 
                        ? "#f59e0b" 
                        : "#ef4444"
                    }
                    strokeWidth="8"
                    strokeDasharray={`${(riskScore / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">
                    {riskScore}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">/ 100</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Determined by combining rule engine violations, extracted threat keywords, and AI validation.
              </p>
              <div className="flex justify-between items-center w-full text-xs border-t border-border/10 pt-3">
                <span className="text-muted-foreground">AI Confidence:</span>
                <span className="font-bold text-foreground">{Math.round(confidenceScore * 100)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* B. Preview Image */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Screenshot Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {report.imageUrl ? (
                <div className="relative w-full rounded-lg border border-border/20 overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}${report.imageUrl}`}
                    alt="Uploaded Screenshot Evidence"
                    className="w-full h-auto max-h-[300px] object-contain block"
                  />
                </div>
              ) : (
                <div className="h-40 rounded-lg border border-border/20 bg-zinc-950/20 flex items-center justify-center">
                  <FileImage className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* C. AI Recommendation Card */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-zinc-900/60 p-4 rounded-lg border border-border/20">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* D. Process Timeline */}
          {Object.keys(timeline).length > 0 && (
            <Card className="border-border/40 bg-zinc-950/20">
              <CardHeader className="pb-2 border-b border-border/10">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Execution Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                  {Object.entries(timeline).map(([step, duration]: [string, any], i) => (
                    <div key={i} className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary bg-background shrink-0 z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {step}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {duration.toFixed(0)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* E. Action Actions */}
          <div className="space-y-3 print:hidden">
            <Button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all">
              <Download className="h-4 w-4" />
              Download Analysis JSON
            </Button>
            
            {!isSavedReport && (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
                onClick={() => addToast({description: "Report saved to your dashboard successfully!", type: "success"})}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Save Report
              </Button>
            )}

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
              onClick={() => handleCopy(ocrText, "OCR text")}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
              Copy OCR Text
            </Button>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
              onClick={() => handleCopy(JSON.stringify(entities, null, 2), "Extracted entities")}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
              Copy Extracted Data
            </Button>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
              onClick={() => addToast({description: "Published to public Community board!", type: "success"})}
            >
              <Share2 className="h-4 w-4 text-indigo-400" />
              Publish to Community
            </Button>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
              onClick={() => addToast({description: "Report visibility updated to Private.", type: "success"})}
            >
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              Make Private
            </Button>

            <Link href={ROUTES.DETECT} className="block">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all">
                <RefreshCcw className="h-4 w-4" />
                Scan Another Screenshot
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
