import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Brain, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

import { AIAnalysisResult } from "@/types/intelligence";

interface AIIntelligenceCardProps {
  aiAnalysis: AIAnalysisResult | null;
}

export function AIIntelligenceCard({ aiAnalysis }: AIIntelligenceCardProps) {
  if (!aiAnalysis) {
    return (
      <Card className="bg-zinc-950/20 border-border/40">
        <CardContent className="p-5 flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground block">AI Summary Unavailable</span>
            <p className="text-[10px] leading-relaxed">
              No API key has been configured for Gemini, or the request timed out. Local rule engine telemetry remains fully operational.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-500/30 bg-indigo-950/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-3 text-indigo-500/10 select-none pointer-events-none">
        <Sparkles className="h-20 w-20 stroke-[1]" />
      </div>
      
      <CardHeader className="pb-3 border-b border-indigo-500/10 flex flex-row items-center gap-2">
        <div className="h-7 w-7 rounded bg-indigo-500/15 flex items-center justify-center text-indigo-400">
          <Brain className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Gemini AI Cyber Analysis
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4 text-xs">
        {/* Threat Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-3 border-b border-border/10">
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Threat Summary</span>
            <p className="text-foreground leading-relaxed font-semibold">{aiAnalysis.ai_summary}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Website Category</span>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold uppercase text-[9px] tracking-wider py-1 px-2.5">
              {aiAnalysis.website_category}
            </Badge>
          </div>
        </div>
        
        {/* Threat Intelligence & SSL Panel */}
        {aiAnalysis.threat_intel && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-950/40 p-3 rounded-lg border border-border/10">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Google Safe Browsing</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.threat_intel.google_safe_browsing === "CLEAN" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.threat_intel.google_safe_browsing || "N/A"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">VirusTotal</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.threat_intel.virustotal === "CLEAN" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.threat_intel.virustotal || "N/A"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">PhishTank</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.threat_intel.phishtank === "CLEAN" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.threat_intel.phishtank || "N/A"}
              </Badge>
            </div>
          </div>
        )}

        {/* Multi-Dimensional Risk Profile */}
        <div className="space-y-2 bg-zinc-950/30 p-3 rounded-lg border border-border/10">
          <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Multi-Dimensional Risk Profile</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Cyber Threat Risk</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.cyber_threat === "Very Low" || aiAnalysis.cyber_threat === "Low" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : aiAnalysis.cyber_threat === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.cyber_threat || "Very Low"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Privacy Risk</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.privacy_risk === "Low" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : aiAnalysis.privacy_risk === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.privacy_risk || "Low"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Financial Risk</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.financial_risk === "Low" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : aiAnalysis.financial_risk === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.financial_risk || "Low"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Download Risk</span>
              <Badge variant="outline" className={`text-[9px] font-bold uppercase ${aiAnalysis.download_risk === "Low" ? "text-teal-400 border-teal-500/20 bg-teal-500/10" : aiAnalysis.download_risk === "Medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-destructive border-destructive/20 bg-destructive/10"}`}>
                {aiAnalysis.download_risk || "Low"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cognitive Analysis</span>
          <p className="text-muted-foreground leading-relaxed">{aiAnalysis.ai_summary}</p>
        </div>

        {/* Evidence Collected Checklist */}
        {aiAnalysis.evidence_collected && aiAnalysis.evidence_collected.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Evidence Collected</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              {aiAnalysis.evidence_collected.map((finding, idx) => (
                <div key={idx} className="bg-zinc-950/40 p-2.5 rounded border border-border/10 text-[10px] text-foreground leading-snug flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        ) : aiAnalysis.triggered_rules && aiAnalysis.triggered_rules.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Triggered Rules</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              {aiAnalysis.triggered_rules.map((finding, idx) => (
                <div key={idx} className="bg-zinc-950/40 p-2.5 rounded border border-border/10 text-[10px] text-foreground leading-snug">
                  {finding}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Prevention tips */}
        {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
          <div className="space-y-2 bg-zinc-950/30 p-3 rounded-lg border border-border/10">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Actionable Safety Recommendations</span>
            <ul className="space-y-1 text-muted-foreground">
              {aiAnalysis.recommendations.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-indigo-400 mt-0.5">▪</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verdict Badge Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 gap-3 mt-2">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-indigo-300">Final Verdict Recommendation</span>
            <p className="font-semibold text-foreground text-xs">{aiAnalysis.final_threat_level}</p>
          </div>
          {aiAnalysis.ai_confidence !== null && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Confidence: {Math.round(aiAnalysis.ai_confidence * 100)}%
            </span>
            <Badge className="bg-zinc-900/80 text-indigo-400 border-indigo-500/20 font-bold uppercase text-[8px] tracking-wider">
              {aiAnalysis.ai_confidence >= 0.8 ? "High" : aiAnalysis.ai_confidence >= 0.5 ? "Medium" : "Low"}
            </Badge>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
