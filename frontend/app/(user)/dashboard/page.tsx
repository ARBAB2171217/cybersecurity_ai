
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useDetectionStore } from "@/store/detection.store";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Activity, ChevronRight, LayoutDashboard, Settings, Globe, BarChart3, Scan, FileText, CheckCircle2, ChevronDown, Moon, Sun, AlertTriangle } from "lucide-react";

export default function UserDashboardPage() {
  const { reports, total, isLoading: isLoadingReports } = useReports({ limit: 100 });
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { status, progress } = useDetectionStore();

  const safeReports = reports || [];
  
  // Calculations
  const stats = useMemo(() => {
    if (safeReports.length === 0) return {
      total: total || 0,
      threatsPrevented: 0,
      todaysReports: 0,
      avgConfidence: 0,
      accuracy: 0,
      threatScore: 0,
      categories: {},
      locations: {}
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let counterfeit = 0;
    let confSum = 0;
    let riskSum = 0;
    let todays = 0;
    const cats: Record<string, number> = {};
    const locs: Record<string, number> = {};

    safeReports.forEach(r => {
      if (r.isCounterfeit) counterfeit++;
      confSum += (r.confidenceScore || 0);
      riskSum += (r.isCounterfeit ? 100 : r.isCounterfeit === null ? 50 : 0);
      if (new Date(r.createdAt) >= today) todays++;
      
      const c = r.category || "Unknown";
      cats[c] = (cats[c] || 0) + 1;
      
      const l = r.location || "India";
      locs[l] = (locs[l] || 0) + 1;
    });

    return {
      total: total || 0,
      threatsPrevented: total ? (counterfeit / total) * 100 : 0,
      todaysReports: todays,
      avgConfidence: (confSum / safeReports.length) * 100,
      accuracy: 98.5, // System accuracy static or from config
      threatScore: (riskSum / safeReports.length) * 100,
      categories: cats,
      locations: locs,
      dailyTrend: Array.from({ length: 7 }).map((_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - (6 - i));
         d.setHours(0,0,0,0);
         const next = new Date(d);
         next.setDate(next.getDate() + 1);
         const c = safeReports.filter(r => {
           const dt = new Date(r.createdAt);
           return dt >= d && dt < next;
         }).length;
         return c;
      })
    };
  }, [safeReports, total]);

  
  const pieChartBackground = useMemo(() => {
    if (Object.keys(stats.categories).length === 0) return "#272343";
    const result = Object.values(stats.categories).reduce((acc, count, i) => {
       const colors = ["#00C2FF", "#B026FF", "#9CA3AF", "#EF4444"];
       const percentage = (count as number / safeReports.length) * 100;
       const start = acc.current;
       acc.current += percentage;
       acc.stops.push(`${colors[i % colors.length]} ${start}% ${acc.current}%`);
       return acc;
    }, { current: 0, stops: [] as string[] });
    return `conic-gradient(${result.stops.join(", ")})`;
  }, [stats.categories, safeReports.length]);

  const sortedReports = [...safeReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-2 w-full max-w-full">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-lg bg-surface border border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><Sun className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-zinc-800"><Moon className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" className="h-10 border-border bg-surface"><Sun className="h-4 w-4 mr-2" /> Theme Toggle</Button>
            <Link href={ROUTES.DETECT}>
              <Button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"><Scan className="h-4 w-4 mr-2" /> Quick Scan</Button>
            </Link>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Total Scans</div>
              <div className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
              <div className="flex items-end gap-1 h-8 mt-2">
                {(stats.dailyTrend || []).map((count, i) => {
                  const max = Math.max(...(stats.dailyTrend || []), 1);
                  const h = (count / max) * 100;
                  return (
                    <div key={i} className="flex-1 bg-primary/40 rounded-sm hover:bg-primary transition-colors" style={{ height: `${Math.max(h, 5)}%` }} />
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Threats Prevented</div>
              <div className="text-2xl font-bold text-foreground">{stats.threatsPrevented.toFixed(2)}%</div>
              <svg className="w-full h-8 mt-2 text-primary" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,25 C20,10 40,30 60,15 C80,0 100,20 100,20" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Today's Reports</div>
              <div className="text-2xl font-bold text-foreground">{stats.todaysReports}</div>
              <div className="w-full h-1.5 bg-primary/20 rounded-full mt-auto">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(stats.todaysReports * 10, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Average Confidence</div>
              <div className="text-2xl font-bold text-foreground">{stats.avgConfidence.toFixed(0)}%</div>
              <div className="w-full h-1.5 bg-primary/20 rounded-full mt-auto">
                <div className="h-full bg-primary rounded-full" style={{ width: `${stats.avgConfidence}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Detection Accuracy</div>
              <div className="text-2xl font-bold text-foreground">{stats.accuracy}%</div>
              <div className="w-full h-1.5 bg-secondary/20 rounded-full mt-auto">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${stats.accuracy}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              <div className="text-xs text-muted-foreground font-semibold">Recent Threat Score</div>
              <div className="text-2xl font-bold text-foreground">{stats.threatScore.toFixed(0)}</div>
              <div className="w-full h-1.5 bg-primary/20 rounded-full mt-auto">
                <div className="h-full bg-primary rounded-full" style={{ width: `${stats.threatScore}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card col-span-1">
                <CardHeader className="p-3 pb-0"><CardTitle className="text-[11px] text-muted-foreground">Detection Distribution</CardTitle></CardHeader>
                <CardContent className="p-3 pt-2">
                  <div 
                    className="aspect-square rounded-full relative flex items-center justify-center border-4 border-surface" 
                    style={{ background: pieChartBackground }}
                  >
                    <div className="absolute inset-2 bg-surface rounded-full" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card col-span-1">
                <CardHeader className="p-3 pb-0"><CardTitle className="text-[11px] text-muted-foreground">Threat Categories</CardTitle></CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  {Object.entries(stats.categories).slice(0, 4).map(([cat, count], i) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                        <div className={`h-1.5 w-1.5 rounded-full ${i===0?"bg-primary":i===1?"bg-secondary":"bg-muted"}`} />
                        <span className="truncate">{cat}</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                         <div className={`h-full ${i===0?"bg-primary":i===1?"bg-secondary":"bg-muted"}`} style={{ width: `${Math.min((count as number / safeReports.length) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.categories).length === 0 && <div className="text-[10px] text-muted-foreground">No data</div>}
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card flex-1">
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <CardTitle className="text-xs font-semibold">Recent Threat Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {sortedReports.slice(0, 5).map((r, i) => (
                    <div key={r.id} className="p-3 flex items-center gap-3 hover:bg-white/5">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${r.isCounterfeit ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{r.isCounterfeit ? "Threat Detected" : "Recent Detected"}</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {r.category}: {r.evidenceType}
                      </div>
                    </div>
                  ))}
                  {sortedReports.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">No recent threats</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col">
             <Card className="glass-card shrink-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold">Animated AI Processing Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center relative z-10">
                   {["Upload", "Classification", "Analysis", "Report"].map((step, i) => {
                      const isActive = status !== "idle" && status !== "success"; // simplified active state
                      return (
                        <div key={step} className="flex flex-col items-center gap-2">
                          <div className={`h-2 w-12 rounded-full ${isActive ? "bg-primary shadow-[0_0_10px_rgba(0,194,255,0.8)]" : "bg-muted"}`} />
                          <span className="text-[9px] text-muted-foreground uppercase">{step}</span>
                        </div>
                      )
                   })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card flex-1 flex flex-col">
              <CardHeader className="p-4 pb-2 border-b border-border/50 flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold">Latest Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Severity</th>
                      <th className="p-3 font-medium">Timestamp</th>
                      <th className="p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedReports.slice(0, 6).map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                           <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${r.isCounterfeit ? "bg-destructive" : "bg-emerald-500"}`} />
                             <span className="truncate max-w-[100px] block">{r.category}</span>
                           </div>
                        </td>
                        <td className="p-3">
                           {r.isCounterfeit ? <span className="text-destructive font-semibold">High</span> : <span className="text-emerald-500 font-semibold">Low</span>}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                           {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                           <Link href={ROUTES.DETECTION_RESULT(r.id)}>
                             <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 bg-transparent border-border/50 hover:bg-white/10">View</Button>
                           </Link>
                        </td>
                      </tr>
                    ))}
                    {sortedReports.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No reports available</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
