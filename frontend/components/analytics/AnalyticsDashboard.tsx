"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { BarChart } from "@/components/charts/BarChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Activity, Database, ShieldAlert, ShieldCheck, FileText, Clock } from "lucide-react";

export function AnalyticsDashboard() {
  const { summary, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10">
        <span className="text-xs text-muted-foreground font-semibold animate-pulse">
          Retrieving platform analytics...
        </span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10 text-center p-6">
        <span className="text-xs font-semibold text-muted-foreground">
          Failed to load analytics dashboard.
        </span>
      </div>
    );
  }

  // Map real backend fields (snake_case from dict)
  const totalScans = (summary.total_scans as number) ?? 0;
  const counterfeitScans = (summary.counterfeit_scans as number) ?? 0;
  const genuineScans = (summary.genuine_scans as number) ?? 0;
  const pendingReview = (summary.pending_review as number) ?? 0;
  const counterfeitRate = (summary.counterfeit_rate as number) ?? 0;
  const byDenomination = (summary.by_denomination as Record<string, number>) ?? {};
  
  const avgDetectionTime = (summary.average_detection_time_ms as number) ?? 0;
  const avgOcrTime = (summary.average_ocr_time_ms as number) ?? 0;
  const avgGeminiTime = (summary.average_gemini_time_ms as number) ?? 0;
  const cacheHitRate = (summary.cache_hit_rate_percent as number) ?? 0;
  const avgConfidence = (summary.average_confidence as number) ?? 0;
  const mostScanned = (summary.most_scanned_denomination as string) ?? "N/A";
  const apiUsage = (summary.api_usage as number) ?? 0;
  const daily = (summary.daily_stats as number) ?? 0;
  const weekly = (summary.weekly_stats as number) ?? 0;
  const monthly = (summary.monthly_stats as number) ?? 0;

  const barData = Object.entries(byDenomination).map(([denom, count]) => ({
    label: `₹${denom}`,
    value: count as number,
  }));

  const qrTotal = (summary.qr_total as number) ?? 0;
  const qrThreatDistribution = (summary.qr_threat_distribution as Record<string, number>) ?? {};
  const qrTypeDistribution = (summary.qr_type_distribution as Record<string, number>) ?? {};

  const qrBarData = Object.entries(qrTypeDistribution).map(([type, count]) => ({
    label: type,
    value: count as number,
  }));

  const statsCards = [
    {
      label: "Total Scans",
      value: totalScans,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Counterfeits Detected",
      value: counterfeitScans,
      icon: ShieldAlert,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Genuine Notes",
      value: genuineScans,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Review",
      value: pendingReview,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{value.toLocaleString()}</div>
              {label === "Counterfeits Detected" && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Rate: <span className="font-bold text-destructive">{counterfeitRate.toFixed(1)}%</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Denomination Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Volume by Denomination</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <BarChart data={barData} />
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              No denomination data yet.
            </div>
          )}
        </CardContent>
      </Card>

      {qrTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Volume by QR Type</CardTitle>
            </CardHeader>
            <CardContent>
              {qrBarData.length > 0 ? (
                <BarChart data={qrBarData} />
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  No QR type data yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Threat Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Safe / Low Risk", value: (qrThreatDistribution.Safe ?? 0) + (qrThreatDistribution.Low ?? 0), total: qrTotal, color: "bg-emerald-500" },
                { label: "Medium Risk", value: qrThreatDistribution.Medium ?? 0, total: qrTotal, color: "bg-amber-500" },
                { label: "High Risk", value: qrThreatDistribution.High ?? 0, total: qrTotal, color: "bg-orange-500" },
                { label: "Critical Risk", value: qrThreatDistribution.Critical ?? 0, total: qrTotal, color: "bg-destructive" },
              ].map(({ label, value, total, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">{label}</span>
                    <span className="font-bold text-foreground">
                      {value} ({total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-border/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Counterfeit Rate Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Counterfeit Detection Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Platform Rate</span>
              <span className="text-xl font-black text-foreground">{counterfeitRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-destructive transition-all duration-700"
                style={{ width: `${Math.min(counterfeitRate, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {counterfeitScans} out of {totalScans} scanned notes flagged as counterfeit.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Genuine vs Counterfeit Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Genuine Notes", value: genuineScans, total: totalScans, color: "bg-emerald-500" },
              { label: "Counterfeit Notes", value: counterfeitScans, total: totalScans, color: "bg-destructive" },
              { label: "Pending Review", value: pendingReview, total: totalScans, color: "bg-amber-500" },
            ].map(({ label, value, total, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">{label}</span>
                  <span className="font-bold text-foreground">
                    {value} ({total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Monitoring - Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance & Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Average Detection Time</span>
              <span className="font-bold text-foreground">{avgDetectionTime.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">OCR Processing</span>
              <span className="font-bold text-foreground">{avgOcrTime.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Gemini AI Analysis</span>
              <span className="font-bold text-foreground">{avgGeminiTime.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Cache Hit Rate</span>
              <span className="font-bold text-emerald-400">{cacheHitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">API Requests</span>
              <span className="font-bold text-foreground">{apiUsage.toLocaleString()} calls</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detection Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Average Confidence</span>
              <span className="font-bold text-emerald-400">{avgConfidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Most Scanned Denomination</span>
              <span className="font-bold text-foreground">₹{mostScanned}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Today (24h)</span>
              <span className="font-bold text-foreground">{daily} scans</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">This Week (7d)</span>
              <span className="font-bold text-foreground">{weekly} scans</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">This Month (30d)</span>
              <span className="font-bold text-foreground">{monthly} scans</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
