import React, { useState, useMemo, useCallback } from "react";
import { Report } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  CreditCard,
  Wifi,
  Mail,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Download,
  Flag,
  RefreshCcw,
  Clock,
  Info,
  MapPin,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface QRResultViewProps {
  report: Report;
  isSavedReport?: boolean;
}

/**
 * Strips dangerous control characters and trims the content.
 */
function sanitizeString(str: string): string {
  if (!str) return "";
  // Strip control characters (ASCII 0-31), except tab (9) and newline (10)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Escapes HTML characters to prevent XSS injection.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function QRResultView({ report, isSavedReport = false }: QRResultViewProps) {
  const { addToast } = useToast();
  
  // Memoized extraction of QR details to avoid excessive object lookup on re-renders
  const qrDetails = useMemo(() => report.rawAiResponse?.qr_details, [report.rawAiResponse]);
  const riskAnalysis = useMemo(() => qrDetails?.risk_analysis, [qrDetails]);

  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Helper to determine threat colors (Memoized static mapping)
  const getThreatLevelColor = useCallback((level: string) => {
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

  const getTypeIcon = useCallback((type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("upi")) return <CreditCard className="h-4 w-4 text-primary" />;
    if (t.includes("url") || t.includes("website")) return <LinkIcon className="h-4 w-4 text-primary" />;
    if (t.includes("wifi")) return <Wifi className="h-4 w-4 text-primary" />;
    if (t.includes("sms")) return <Smartphone className="h-4 w-4 text-primary" />;
    if (t.includes("email")) return <Mail className="h-4 w-4 text-primary" />;
    if (t.includes("geo") || t.includes("location")) return <MapPin className="h-4 w-4 text-primary" />;
    return <QrCode className="h-4 w-4 text-primary" />;
  }, []);

  const getActionPreview = useCallback((type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("upi")) return "Pay to Merchant / Send Money";
    if (t.includes("url") || t.includes("website")) return "Opens Website in Browser";
    if (t.includes("wifi")) return "Connects to Wi-Fi Network";
    if (t.includes("sms")) return "Opens SMS App to Send Message";
    if (t.includes("email")) return "Opens Email App to Compose";
    if (t.includes("geo") || t.includes("location")) return "Opens Maps App";
    if (t.includes("vcard") || t.includes("contact")) return "Adds Contact to Phonebook";
    return "Displays Text Content";
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      description: "Content copied to secure clipboard",
      type: "success"
    });
  }, [addToast]);

  // Clean and safely parse content inputs
  const decodedContent = useMemo(() => sanitizeString(qrDetails?.decoded_value || ""), [qrDetails?.decoded_value]);
  const isLongContent = useMemo(() => decodedContent.length > 120, [decodedContent]);
  const displayContent = useMemo(() => {
    if (isContentExpanded || !isLongContent) {
      return decodedContent;
    }
    return `${decodedContent.substring(0, 120)}...`;
  }, [decodedContent, isLongContent, isContentExpanded]);

  const threatLevel = useMemo(() => sanitizeString(riskAnalysis?.risk_level || "Unknown"), [riskAnalysis?.risk_level]);
  const riskScore = useMemo(() => Math.min(Math.max(riskAnalysis?.risk_score || 0, 0), 100), [riskAnalysis?.risk_score]);

  if (!qrDetails || !riskAnalysis) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Invalid QR Analysis Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            The QR analysis result payload is incomplete or missing necessary risk metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Result Header */}
      <div 
        className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-300 ${
          threatLevel.toLowerCase() === 'critical' || threatLevel.toLowerCase() === 'high'
            ? "bg-destructive/5 border-destructive/30 shadow-lg shadow-destructive/5"
            : threatLevel.toLowerCase() === 'medium'
            ? "bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5"
            : "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
        }`}
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
              <QrCode className="h-3.5 w-3.5" />
              QR Detected Successfully
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
              {sanitizeString(qrDetails.qr_type || "Unknown QR")}
              <Badge variant="outline" className={`ml-2 text-xs font-bold border-2 ${getThreatLevelColor(threatLevel)}`}>
                {threatLevel.toUpperCase()} RISK
              </Badge>
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Decoded Content */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {getTypeIcon(qrDetails.qr_type)}
                Decoded Content
              </CardTitle>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-white/5" 
                onClick={() => handleCopy(decodedContent)}
                title="Copy contents"
                aria-label="Copy decoded QR text"
              >
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-zinc-950/80 border border-border/20 rounded-lg p-4 relative group">
                <p className="text-sm font-mono text-foreground break-all whitespace-pre-wrap leading-relaxed select-all">
                  {displayContent}
                </p>
                {isLongContent && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
                    onClick={() => setIsContentExpanded(!isContentExpanded)}
                    aria-expanded={isContentExpanded}
                  >
                    {isContentExpanded ? (
                      <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Show Less</>
                    ) : (
                      <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Show More</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. Information Summary */}
          {qrDetails.extracted_information && Object.keys(qrDetails.extracted_information).length > 0 && (
            <Card className="border-border/40 bg-zinc-950/20">
              <CardHeader className="pb-2 border-b border-border/10">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Extracted Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(qrDetails.extracted_information).map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null;
                    const cleanKey = escapeHtml(sanitizeString(key).replace(/_/g, " "));
                    const cleanVal = escapeHtml(sanitizeString(String(value)));
                    return (
                      <div key={key} className="bg-zinc-900/40 border border-border/20 rounded-lg p-3 hover:border-primary/20 transition-colors">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                          {cleanKey}
                        </p>
                        <p className="text-xs font-semibold text-foreground truncate" title={cleanVal}>
                          {cleanVal}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Security Checks */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Security Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Failed Checks */}
              {riskAnalysis.detected_risks && riskAnalysis.detected_risks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Failed Checks ({riskAnalysis.detected_risks.length})
                  </h4>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg divide-y divide-destructive/10">
                    {riskAnalysis.detected_risks.map((risk, i) => (
                      <div key={i} className="p-3 flex items-start gap-3 text-sm">
                        <XCircle className="h-5 w-5 text-destructive shrink-0" />
                        <span className="text-destructive/90">{sanitizeString(risk)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passed Checks */}
              {riskAnalysis.passed_checks && riskAnalysis.passed_checks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Passed Checks ({riskAnalysis.passed_checks.length})
                  </h4>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg divide-y divide-emerald-500/10">
                    {riskAnalysis.passed_checks.map((check, i) => (
                      <div key={i} className="p-3 flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500/90">{sanitizeString(check)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. AI Intelligence Summary */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                AI Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-zinc-900/60 p-4 rounded-lg border border-border/20">
                <h4 className="text-[11px] font-bold uppercase text-primary mb-1">Threat Summary</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {sanitizeString(riskAnalysis.analysis_summary)}
                </p>
              </div>

              {riskAnalysis.fraud_scenario && (
                <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                  <h4 className="text-[11px] font-bold uppercase text-amber-500 mb-1">Possible Fraud Scenario</h4>
                  <p className="text-sm text-amber-500/90 leading-relaxed">
                    {sanitizeString(riskAnalysis.fraud_scenario)}
                  </p>
                </div>
              )}

              {riskAnalysis.prevention_tips && riskAnalysis.prevention_tips.length > 0 && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="text-[11px] font-bold uppercase text-primary mb-2">Prevention Tips</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-sm text-foreground/80">
                    {riskAnalysis.prevention_tips.map((tip, idx) => (
                      <li key={idx}>{sanitizeString(tip)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {riskAnalysis.final_recommendation && (
                <div className="bg-zinc-900/60 p-4 rounded-lg border border-border/20">
                  <h4 className="text-[11px] font-bold uppercase text-primary mb-1">Final Recommendation</h4>
                  <p className="text-sm font-semibold text-foreground">
                    {sanitizeString(riskAnalysis.final_recommendation)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* 4. Risk Score */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-0 border-b border-border/10">
              <CardTitle className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2">
                Overall Risk Score
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
                Higher score indicates greater potential for fraud or security risk.
              </p>
            </CardContent>
          </Card>

          {/* 7. Action Preview */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Action Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-zinc-950/40 p-4 rounded-lg border border-border/20 text-center space-y-3">
                <p className="text-xs text-muted-foreground">Scanning this QR code natively will:</p>
                <p className="text-sm font-bold text-foreground">
                  {getActionPreview(qrDetails.qr_type)}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> Never executed automatically
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8. Explainability Timeline */}
          <Card className="border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Analysis Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                {[
                  "Upload Received",
                  "QR Detected",
                  "QR Decoded",
                  "Type Classified",
                  "Information Extracted",
                  "Security Checks Completed",
                  "AI Intelligence Generated",
                  "Final Recommendation"
                ].map((step, i) => (
                  <div key={i} className="relative flex items-center gap-3">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary bg-background shrink-0 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 9. User Actions */}
          <div className="space-y-3 print:hidden">
            <Button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all">
              <Download className="h-4 w-4" />
              Download Analysis
            </Button>
            
            {!isSavedReport && (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all" 
                onClick={() => addToast({description: "Report saved to your account!", type: "success"})}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Save Report
              </Button>
            )}

            <Link href={ROUTES.DETECT} className="block">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold hover:bg-white/5 transition-all">
                <RefreshCcw className="h-4 w-4" />
                Scan Another QR
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold transition-all" 
              onClick={() => addToast({description: "Reported to security team.", type: "success"})}
            >
              <Flag className="h-4 w-4" />
              Report as Fraud
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
