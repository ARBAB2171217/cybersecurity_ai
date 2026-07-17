import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/axios";
import { validateUrl, parseUrl, ParsedURLResult } from "@/utils/urlParser";
import { assessUrlSecurity, URLIntelligenceAssessment, RedirectChain } from "@/utils/urlRulesEngine";

// Reusable Components
import { LoadingComponents } from "../url-intelligence/LoadingComponents";
import { URLCard } from "../url-intelligence/URLCard";
import { RedirectTimeline } from "../url-intelligence/RedirectTimeline";
import { DomainIntelligenceCard } from "../url-intelligence/DomainIntelligenceCard";
import { SecurityCheckList } from "../url-intelligence/SecurityCheckList";
import { AIIntelligenceCard } from "../url-intelligence/AIIntelligenceCard";
import { ExplainabilityTimeline } from "../url-intelligence/ExplainabilityTimeline";
import { ActionCenter } from "../url-intelligence/ActionCenter";

import {
  Globe,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  ChevronsRight,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import { AIAnalysisResult } from "@/types/intelligence";
import { motion, AnimatePresence } from "framer-motion";

type ParseState = "idle" | "validating" | "resolving" | "parsing" | "analyzing" | "success" | "error";

export function URLIntelligence() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedOriginal, setParsedOriginal] = useState<ParsedURLResult | null>(null);
  const [parsedFinal, setParsedFinal] = useState<ParsedURLResult | null>(null);
  const [redirectChain, setRedirectChain] = useState<RedirectChain | null>(null);
  const [assessment, setAssessment] = useState<URLIntelligenceAssessment | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // We can't rely on handleAnalyze in useEffect directly if it depends on state,
  // but we can define an inner effect since handleAnalyze uses the inputUrl state.
  React.useEffect(() => {
    if (initialUrl && !autoAnalyzed && parseState === "idle") {
      setAutoAnalyzed(true);
      // Wait for state to settle then click
      setTimeout(() => {
        const btn = document.getElementById("hidden-analyze-btn");
        if (btn) btn.click();
      }, 100);
    }
  }, [initialUrl, autoAnalyzed, parseState]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);
    setParsedOriginal(null);
    setParsedFinal(null);
    setRedirectChain(null);
    setAssessment(null);
    setAiAnalysis(null);

    // 1. Validating State
    setParseState("validating");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const valResult = validateUrl(inputUrl);
    if (!valResult.isValid) {
      setValidationError(valResult.error || "The URL syntax is malformed or invalid.");
      setParseState("error");
      return;
    }

    // 2. Resolving Redirects State
    setParseState("resolving");
    let resolvedData: RedirectChain | null = null;
    try {
      const response = await api.post("/detection/resolve-url", { url: inputUrl });
      if (response.data && response.data.success) {
        resolvedData = response.data.data;
      }
    } catch (err: any) {
      console.warn("Failed to programmatically follow redirect chain:", err);
    }

    // 3. Parsing State
    setParseState("parsing");
    await new Promise((resolve) => setTimeout(resolve, 300));

    let finalParsed: ParsedURLResult;
    let originalParsed: ParsedURLResult;
    let securityAssessment: URLIntelligenceAssessment;

    try {
      originalParsed = parseUrl(inputUrl);
      setParsedOriginal(originalParsed);

      const finalDestUrl = resolvedData ? resolvedData.final_url : inputUrl;
      finalParsed = parseUrl(finalDestUrl);
      setParsedFinal(finalParsed);

      setRedirectChain(resolvedData);

      securityAssessment = assessUrlSecurity(finalParsed, resolvedData);
      setAssessment(securityAssessment);
    } catch (err) {
      setValidationError("Failed to complete redirect mapping or parse destination elements.");
      setParseState("error");
      return;
    }

    // 4. AI-powered Gemini Assessment
    setParseState("analyzing");
    try {
      const payload = {
        originalUrl: originalParsed.originalUrl,
        finalUrl: finalParsed.originalUrl,
        category: finalParsed.category,
        ipType: finalParsed.ipType,
        riskScore: securityAssessment.riskScore,
        threatLevel: securityAssessment.threatLevel,
        triggeredRules: securityAssessment.triggeredRules.map(r => ({
          name: r.name,
          status: r.status,
          severity: r.severity,
          reason: r.reason
        })),
        brandMatch: securityAssessment.brandMatch || {},
        redirectChain: resolvedData || undefined
      };

      const aiResponse = await api.post("/detection/analyze-url", payload);
      if (aiResponse.data && aiResponse.data.success) {
        setAiAnalysis(aiResponse.data.data);
      }
    } catch (err) {
      console.error("Gemini AI URL intelligence analysis failed:", err);
    }

    setParseState("success");
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "Safe": 
      case "Low":
      case "Low Risk": return "text-teal-400 border-teal-500/20 bg-teal-500/10";
      case "Medium":
      case "Medium Risk": return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      case "High":
      case "High Risk": return "text-orange-400 border-orange-500/20 bg-orange-500/10";
      case "Critical":
      case "Dangerous": return "text-destructive border-destructive/20 bg-destructive/10";
      default: return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  const isProcessing = parseState === "validating" || parseState === "resolving" || parseState === "parsing" || parseState === "analyzing";

  const handleReset = () => {
    setInputUrl("");
    setParseState("idle");
    setParsedOriginal(null);
    setParsedFinal(null);
    setRedirectChain(null);
    setAssessment(null);
    setAiAnalysis(null);
  };

  return (
    <Card className="bg-zinc-950/40 backdrop-blur-md border-border/40 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-teal-500/50 to-indigo-500/50" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="pb-4 border-b border-border/10 bg-zinc-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center border border-teal-500/20 shadow-inner">
              <Globe className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                URL Intelligence Hub
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Audit external destinations safely using programmatic redirect tracing, DNS parsing, brand spoof checks, and Gemini AI modeling.
              </p>
            </div>
          </div>
          {parseState === "success" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border/40 hover:bg-white/5 font-semibold"
              onClick={handleReset}
            >
              Analyze New Link
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* URL Input Form (Visible only when idle or error) */}
        <AnimatePresence mode="wait">
          {(parseState === "idle" || parseState === "error") && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleAnalyze} 
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/secure-login-portal"
                    className="w-full bg-zinc-900/50 border border-border/30 rounded-xl py-3 pl-4 pr-10 text-sm font-mono text-foreground placeholder-muted-foreground/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 focus:outline-none transition-all shadow-inner"
                    disabled={isProcessing}
                    aria-label="URL Input for Security Check"
                  />
                  <LinkIcon className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-teal-500/60 transition-colors" />
                </div>
                <Button
                  id="hidden-analyze-btn"
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all px-8 rounded-xl min-w-[140px] shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                  disabled={isProcessing || !inputUrl.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Inspect Link
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Loading Progress State & Skeletons */}
        {isProcessing && (
          <LoadingComponents
            stage={
              parseState === "validating"
                ? "validating"
                : parseState === "resolving"
                ? "resolving"
                : parseState === "parsing"
                ? "parsing"
                : "analyzing"
            }
          />
        )}

        {/* Error Experience Layout */}
        {parseState === "error" && validationError && (
          <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 text-xs space-y-3">
            <div className="flex items-start gap-2.5 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Security Analysis Halted</span>
                <p className="text-[11px] text-destructive/80 leading-relaxed">{validationError}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border/10 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/30 text-[10px] h-8 hover:bg-white/5 font-semibold"
                onClick={handleReset}
              >
                Clear Input
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-8 font-semibold"
                onClick={() => handleAnalyze()}
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Successful Analysis Results */}
        {parseState === "success" && parsedOriginal && parsedFinal && assessment && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            
            {/* Overview / Result Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div className="md:col-span-2 flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/50 border border-border/30 gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Target Address
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-muted-foreground line-through break-all select-all">
                      Original: {parsedOriginal.originalUrl}
                    </p>
                    <p className="text-sm font-mono text-foreground break-all select-all font-semibold flex items-center gap-1.5">
                      <ChevronsRight className="h-4 w-4 text-emerald-400 shrink-0" />
                      Final: {parsedFinal.originalUrl}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    Category: {aiAnalysis ? aiAnalysis.website_category : parsedFinal.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getThreatColor(aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel)}`}>
                    Threat Level: {aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel}
                  </Badge>
                  {aiAnalysis && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border-indigo-500/20 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      AI Recommendation: {aiAnalysis.recommendations[0] || "View detailed results."}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Combined Risk Score Visual Gauge */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-border/20">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Overall Risk Score</span>
                  <h4 className={`text-lg font-black ${getThreatColor(aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel)}`}>
                    {(aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel).toUpperCase()}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Telemetry Check: {aiAnalysis ? "AI Validated" : `${assessment.riskScore}/100`}
                  </p>
                </div>
                <div className="relative h-16 w-16 shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        (aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel) === "Safe" || (aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel) === "LOW RISK" || (aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel) === "Low"
                          ? "#10b981"
                          : (aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel) === "SUSPICIOUS" || (aiAnalysis ? aiAnalysis.final_threat_level : assessment.threatLevel) === "Medium"
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${((aiAnalysis ? aiAnalysis.final_risk_score : assessment.riskScore) / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
                    {aiAnalysis ? aiAnalysis.final_risk_score : assessment.riskScore}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Summary Card */}
            <AIIntelligenceCard aiAnalysis={aiAnalysis} />

            {/* Layout Grid columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left & Middle Column details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Original vs Final URL Component Card */}
                <URLCard original={parsedOriginal} final={parsedFinal} />

                {/* Redirect steps trace */}
                {redirectChain && <RedirectTimeline redirectData={redirectChain} />}

                {/* Domain & Brand intelligence */}
                <DomainIntelligenceCard
                  parsedFinal={parsedFinal}
                  brandMatch={assessment.brandMatch}
                  consistency={assessment.consistency}
                />

                {/* Security checks list */}
                <SecurityCheckList
                  passedChecks={assessment.passedChecks}
                  failedChecks={assessment.failedChecks}
                  warningChecks={assessment.warningChecks}
                />
              </div>

              {/* Right Column: Timelines & Controls */}
              <div className="space-y-6">
                {/* Explainability Timeline of the entire pipeline */}
                <ExplainabilityTimeline
                  hasRedirects={!!redirectChain}
                  hasAi={!!aiAnalysis}
                />

                {/* Action Center control panel */}
                <ActionCenter
                  originalUrl={parsedOriginal.originalUrl}
                  finalUrl={parsedFinal.originalUrl}
                  assessment={assessment}
                  aiAnalysis={aiAnalysis}
                  onReset={handleReset}
                />
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
