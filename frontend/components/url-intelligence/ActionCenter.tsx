import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import { Copy, Download, Save, ExternalLink, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { ParsedURLResult } from "@/utils/urlParser";
import { URLIntelligenceAssessment } from "@/utils/urlRulesEngine";

interface ActionCenterProps {
  originalUrl: string;
  finalUrl: string;
  assessment: URLIntelligenceAssessment;
  aiAnalysis: any;
  onReset: () => void;
}

export function ActionCenter({
  originalUrl,
  finalUrl,
  assessment,
  aiAnalysis,
  onReset
}: ActionCenterProps) {
  const [copiedReport, setCopiedReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);

  const getCombinedReportText = () => {
    const reportData = {
      originalUrl,
      finalUrl,
      riskScore: assessment.riskScore,
      threatLevel: assessment.threatLevel,
      aiAnalysis: aiAnalysis || "Unavailable",
      triggeredRulesCount: assessment.triggeredRules.length,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(reportData, null, 2);
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(getCombinedReportText());
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([getCombinedReportText()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybershield-url-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  const handleSave = async () => {
    setSavingReport(true);
    // Simulate API delay for saving report
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavingReport(false);
    alert("URL Intelligence Report saved successfully into report history!");
  };

  const handleProceedToUrl = () => {
    if (agreeRisk) {
      window.open(finalUrl, "_blank", "noopener,noreferrer");
      setShowOpenModal(false);
      setAgreeRisk(false);
    }
  };

  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Action Control Center
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 text-xs space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-border/30 hover:bg-white/5 h-9 flex items-center justify-center gap-1.5 font-semibold text-[11px]"
            onClick={handleCopyReport}
          >
            {copiedReport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedReport ? "Copied JSON" : "Copy Raw JSON"}
          </Button>

          <Button
            variant="outline"
            className="border-border/30 hover:bg-white/5 h-9 flex items-center justify-center gap-1.5 font-semibold text-[11px]"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download Result
          </Button>

          <Button
            variant="outline"
            className="border-border/30 hover:bg-white/5 h-9 flex items-center justify-center gap-1.5 font-semibold text-[11px]"
            onClick={handleSave}
            disabled={savingReport}
          >
            <Save className="h-3.5 w-3.5" />
            {savingReport ? "Saving..." : "Save Report"}
          </Button>

          <Button
            variant="destructive"
            className="h-9 flex items-center justify-center gap-1.5 font-semibold text-[11px]"
            onClick={() => setShowOpenModal(true)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open URL (Unsafe)
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 h-9 flex items-center justify-center gap-1.5 font-semibold text-[11px]"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Analyze Another URL
        </Button>

        {/* Double Confirmation Modal Dialog */}
        <Dialog
          isOpen={showOpenModal}
          onClose={() => {
            setShowOpenModal(false);
            setAgreeRisk(false);
          }}
          title="Security Warning Confirmation"
        >
          <div className="space-y-4 pt-2">
            <div className="text-zinc-400 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse shrink-0" />
              <span>
                You are about to navigate to an external link which may have been flagged as malicious or suspicious. Opening this URL exposes your browser to potential tracking, malware, or phishing scams.
              </span>
            </div>

            <div className="bg-zinc-900/60 p-3 rounded-lg border border-border/10 font-mono text-[10px] text-zinc-300 break-all select-all">
              Destination: {finalUrl}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreeRisk}
                onChange={(e) => setAgreeRisk(e.target.checked)}
                className="rounded border-border bg-zinc-900 text-indigo-500 focus:ring-indigo-500/40"
              />
              <label htmlFor="agree-checkbox" className="text-[11px] text-zinc-400 cursor-pointer select-none">
                I understand the security implications and wish to proceed anyway.
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-border/10">
              <Button
                variant="outline"
                size="sm"
                className="border-border/30 text-xs"
                onClick={() => {
                  setShowOpenModal(false);
                  setAgreeRisk(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs font-semibold"
                disabled={!agreeRisk}
                onClick={handleProceedToUrl}
              >
                Proceed to URL
              </Button>
            </div>
          </div>
        </Dialog>

      </CardContent>
    </Card>
  );
}
