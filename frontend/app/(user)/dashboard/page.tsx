"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { EvidenceUploader } from "@/components/upload/EvidenceUploader";
import { resolveRole } from "@/utils/permissions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/Progress";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  CheckCircle, 
  PlusCircle, 
  Sparkles,
  X,
  ShieldAlert, 
  ShieldCheck, 
  FileSpreadsheet, 
  BarChart3, 
  AlertCircle, 
  ChevronRight, 
  Activity 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function UserDashboardPage() {
  const { reports, total, isLoading: isLoadingReports } = useReports({ limit: 100 });
  const { user, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();

  const [onboardingDismissed, setOnboardingDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("cybershield_onboarding_dismissed");
      setOnboardingDismissed(dismissed === "true");
    }
  }, []);

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (!isLoadingAuth && user) {
      const role = resolveRole(user);
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, isLoadingAuth, router]);

  const handleDismissOnboarding = () => {
    localStorage.setItem("cybershield_onboarding_dismissed", "true");
    setOnboardingDismissed(true);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("cybershield_onboarding_dismissed");
    setOnboardingDismissed(false);
  };

  if (isLoadingAuth || isLoadingReports || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading dashboard telemetry...</span>
      </div>
    );
  }

  // Calculate real stats
  const safeReports = reports ?? [];
  const totalScans = total || 0;
  const counterfeitCount = safeReports.filter((r) => r?.isCounterfeit).length;
  const genuineCount = safeReports.filter((r) => !r?.isCounterfeit).length;
  // Compute accuracy rate: average confidence score (fraction or percentage)
  const averageConfidence = safeReports.length > 0
    ? (safeReports.reduce((acc, r) => acc + (r?.confidenceScore || 0), 0) / safeReports.length)
    : 0;
  const accuracyRate = averageConfidence > 0
    ? parseFloat((averageConfidence * 100).toFixed(1))
    : 0;

  const stats = {
    totalScans,
    counterfeitCount,
    genuineCount,
    accuracyRate,
  };

  let mostScannedNote = "N/A";
  if (safeReports.length > 0) {
    const denominationCounts = safeReports.reduce((acc, r) => {
      const denom = String(r?.denomination || "unknown");
      if (denom !== "unknown") {
        acc[denom] = (acc[denom] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const keys = Object.keys(denominationCounts);
    if (keys.length > 0) {
      const topDenom = keys.reduce((a, b) => denominationCounts[a] > denominationCounts[b] ? a : b);
      mostScannedNote = `₹${topDenom}`;
    }
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "User Dashboard" },
  ];

  const isNewUser = totalScans === 0;

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumb items={breadcrumbItems} />
          <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
            Security Scan Desk
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor scanned Indian rupee classification history and analytics.
          </p>
        </div>
        {isNewUser && onboardingDismissed && (
          <Button variant="outline" size="sm" onClick={handleResetOnboarding} className="text-xs">
            Show Onboarding Guide
          </Button>
        )}
      </div>

      {/* Onboarding Guide Card */}
      {isNewUser && !onboardingDismissed && (
        <Card className="relative overflow-hidden glass-elevated border-primary/20">
          <button
            onClick={handleDismissOnboarding}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/5 transition-all"
            title="Dismiss Guide"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="p-6 pr-12 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">Quick Start Guide</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">Welcome to your CyberShield AI Dashboard!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Verify rupee banknotes using deep visual analysis. Get started with these simple steps:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
              <div className="bg-surface/50 p-4 rounded-xl border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02]">
                <span className="text-primary font-semibold block mb-1">1. Take a Photo</span>
                Capture a clear, high-resolution image of the front side of the banknote.
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02]">
                <span className="text-primary font-semibold block mb-1">2. Upload & Run</span>
                Go to "Start Note Analysis", select your image, and trigger our AI scanners.
              </div>
              <div className="bg-surface/50 p-4 rounded-xl border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02]">
                <span className="text-primary font-semibold block mb-1">3. Review Verdict</span>
                Check the confidence score, verified denomination, and security watermark check logs.
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleDismissOnboarding}>Got it, thanks!</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Smart Evidence Analysis - Primary Feature */}
      <div className="my-6">
        <EvidenceUploader />
      </div>

      {/* Stats Cards & Quick Actions */}
      <DashboardOverview stats={stats} />

      {/* Reports and Analytics Sections */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
      >
        {/* Reports / History */}
        <Card className="lg:col-span-2 glass-elevated overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border bg-surface/40">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isNewUser ? "Empty Detection History" : "Recent Detection History"}
              </CardTitle>
            </div>
            {!isNewUser && (
              <Link href={ROUTES.REPORTS} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center group">
                View All <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isNewUser ? (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                <div className="p-4 rounded-full bg-surface border border-border text-muted shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                  <FileSpreadsheet className="h-8 w-8 text-primary/80" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">No scans found in history</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    You have not uploaded any currency scans yet. Run your first analysis to begin tracking note authenticity records.
                  </p>
                </div>
                <Link href={ROUTES.DETECT} className="pt-2">
                  <Button size="sm" variant="outline">
                    Upload your first currency image
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {safeReports.slice(0, 5).map((report, idx) => (
                  <motion.div 
                    key={report.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface/60 border border-border/50 text-sm transition-all duration-300 hover:bg-surface hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-border hover:scale-[1.01] group"
                  >
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">#{report.id.slice(0, 8)}</span>
                      <div className="flex items-center gap-1.5">
                        {report.category === "QR Code" ? (
                          <>
                            <span className="font-bold text-foreground">
                              QR: {report.rawAiResponse?.qr_details?.qr_type || "Unknown"}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={report.rawAiResponse?.qr_details?.decoded_value || ""}>
                              ({report.rawAiResponse?.qr_details?.decoded_value || ""})
                            </span>
                          </>
                        ) : report.evidenceType && report.evidenceType !== "Currency Note" && report.evidenceType !== "QR Code" ? (
                          <>
                            <span className="font-bold text-foreground">
                              {report.evidenceType}: {report.category}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-foreground">₹{report.denomination}</span>
                            <span className="text-[10px] text-muted-foreground">({report.serialNumber || "No serial"})</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.evidenceType && report.evidenceType !== "Currency Note" && report.evidenceType !== "QR Code" ? (
                        report.isCounterfeit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                            <ShieldAlert className="h-3.5 w-3.5" /> High Risk Scam
                          </span>
                        ) : report.isCounterfeit === null ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            <AlertCircle className="h-3.5 w-3.5" /> Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" /> Safe
                          </span>
                        )
                      ) : report.category === "QR Code" ? (
                        report.isCounterfeit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                            <ShieldAlert className="h-3.5 w-3.5" /> High Risk
                          </span>
                        ) : report.isCounterfeit === null ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            <AlertCircle className="h-3.5 w-3.5" /> Medium Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" /> Safe
                          </span>
                        )
                      ) : report.isCounterfeit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                          <ShieldAlert className="h-3.5 w-3.5" /> Counterfeit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Genuine
                        </span>
                      )}
                      <Link href={`/detection-result/${report.id}`}>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">View Details</Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        <Card className="glass-elevated overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
          <CardHeader className="pb-4 border-b border-border bg-surface/40">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted">Scan Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 relative z-10">
            {isNewUser ? (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                <div className="p-4 rounded-full bg-zinc-900/60 border border-border/40 text-muted-foreground">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Analytics Unavailable</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Upload data to enable visual scans telemetry and accuracy trend analytics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-muted-foreground">
                    <span>Genuine Banknotes</span>
                    <span>{((genuineCount / totalScans) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(genuineCount / totalScans) * 100}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-muted-foreground">
                    <span>Counterfeit Flagged</span>
                    <span>{((counterfeitCount / totalScans) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="bg-destructive h-full rounded-full" style={{ width: `${(counterfeitCount / totalScans) * 100}%` }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20 mt-4 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Confidence</span>
                    <span className="font-bold text-foreground">{accuracyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Most Scanned Note</span>
                    <span className="font-bold text-foreground">
                      {mostScannedNote}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold flex justify-between pt-4">
                    <span>Recent Uploads</span>
                    <span>{safeReports.filter(r => new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length} this week</span>
                  </p>
                  <Progress value={Math.min((safeReports.filter(r => new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length / 20) * 100, 100)} className="h-1.5 bg-zinc-800" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
