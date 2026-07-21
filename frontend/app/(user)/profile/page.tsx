
"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { ShieldCheck, ShieldAlert, CheckCircle2, Bookmark, Download, ChevronRight, Activity, Moon, Sun, Shield, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { ActiveSessions } from "@/components/profile/ActiveSessions";
import { AccountActions } from "@/components/profile/AccountActions";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export default function ProfilePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const { reports, total, isLoading: reportsLoading } = useReports({ limit: 100 });
  const [activeSettingTab, setActiveSettingTab] = useState<string>("general");

  const safeReports = reports || [];

  const stats = useMemo(() => {
    let confSum = 0;
    let bookmarked = 0;
    const bookmarkedReports: any[] = [];

    safeReports.forEach(r => {
      confSum += (r.confidenceScore || r.classificationConfidence || 0);
      if (r.isBookmarked) {
        bookmarked++;
        bookmarkedReports.push(r);
      }
    });

    return {
      totalInvestigations: total || 0,
      accuracy: safeReports.length ? (confSum / safeReports.length) * 100 : 0,
      bookmarksCount: bookmarked,
      bookmarkedReports: bookmarkedReports,
      points: 0 // Mockup shows 880, but instruction says if no community module, hide or show 0. We'll show 0 points if we don't have it.
    };
  }, [safeReports, total]);

  const initials = useMemo(() => {
    if (!user?.fullName) return "U";
    return user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  }, [user?.fullName]);

  if (authLoading) {
    return <PageContainer><div className="p-8 text-center text-muted-foreground animate-pulse">Loading Profile...</div></PageContainer>;
  }

  if (!user) {
    return <PageContainer><div className="p-8 text-center text-destructive">User not found</div></PageContainer>;
  }

  const sortedReports = [...safeReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 py-2 w-full max-w-full">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-lg bg-surface border border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><Sun className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-zinc-800"><Moon className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" className="h-10 border-border bg-surface"><Sun className="h-4 w-4 mr-2" /> Theme Toggle</Button>
            <Link href={ROUTES.DETECT}>
              <Button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"><Activity className="h-4 w-4 mr-2" /> Quick Scan</Button>
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Col 1: Profile & Achievements (3 span) */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            <Card className="glass-elevated border-border/50 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
               <CardContent className="p-6 flex flex-col items-center text-center space-y-4 relative z-10">
                 <div className="relative">
                   {('avatar' in user ? user.avatar : undefined) ? (
                     <img src={('avatar' in user ? user.avatar : undefined)} alt={user.fullName} className="h-28 w-28 rounded-full border-4 border-surface shadow-xl object-cover" />
                   ) : (
                     <div className="h-28 w-28 rounded-full border-4 border-surface shadow-xl bg-zinc-800 flex items-center justify-center text-3xl font-black text-muted-foreground">
                       {initials}
                     </div>
                   )}
                   {('isVerified' in user ? user.isVerified : false) && (
                     <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full p-1 border-2 border-surface shadow-lg">
                       <CheckCircle2 className="h-4 w-4 text-white" />
                     </div>
                   )}
                 </div>
                 <div className="space-y-1">
                   <h2 className="text-xl font-bold text-foreground tracking-tight">{user.fullName}</h2>
                   <p className="text-sm text-muted-foreground capitalize">{role ? role.toLowerCase() : "Investigator"}</p>
                 </div>
                 {('isVerified' in user ? user.isVerified : false) && (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                     <CheckCircle2 className="h-3 w-3" /> Verified
                   </span>
                 )}
               </CardContent>
            </Card>

            <Card className="glass-card flex-1">
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Achievements</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center min-h-[120px]">
                No achievements yet.
              </CardContent>
            </Card>
          </div>

          {/* Col 2: Stats (3 span) */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            <Card className="glass-card">
              <CardContent className="p-4 flex flex-col space-y-2">
                <div className="text-xs text-muted-foreground font-semibold">Total Investigations</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalInvestigations.toLocaleString()}</div>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[10, 20, 30, 40, 25, 45, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4 flex flex-col space-y-2">
                <div className="text-xs text-muted-foreground font-semibold">Report Generation Accuracy</div>
                <div className="text-2xl font-bold text-foreground">{stats.accuracy.toFixed(1)}%</div>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[20, 30, 20, 40, 30, 50, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4 flex flex-col space-y-2">
                <div className="text-xs text-muted-foreground font-semibold">Active Bookmarks</div>
                <div className="text-2xl font-bold text-foreground">{stats.bookmarksCount}</div>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[5, 10, 5, 15, 10, 20, 10].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 3: Reports History & Settings (6 span) */}
          <div className="lg:col-span-6 space-y-4 flex flex-col">
            {/* Reports History */}
            <Card className="glass-card flex-1 flex flex-col min-h-[300px]">
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Reports History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Report Type</th>
                      <th className="p-3 font-medium">Result</th>
                      <th className="p-3 font-medium">Confidence</th>
                      <th className="p-3 font-medium">Risk</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedReports.slice(0, 5).map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                           <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${r.isCounterfeit ? "bg-destructive" : "bg-emerald-500"}`} />
                             <span className="font-semibold">{r.category || r.evidenceType || "Unknown"}</span>
                           </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[120px] truncate">
                           {r.isCounterfeit ? "Severe Risk" : "Safe"}
                        </td>
                        <td className="p-3">
                           {(r.confidenceScore || 0) * 100}%
                        </td>
                        <td className="p-3">
                           {r.isCounterfeit ? <span className="bg-destructive/20 text-destructive px-1.5 py-0.5 rounded text-[10px] font-bold">H</span> : <span className="bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded text-[10px] font-bold">S</span>}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                           {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                           <div className="flex gap-2">
                              <Bookmark className={`h-3 w-3 ${r.isBookmarked ? "text-primary" : "text-muted-foreground"}`} />
                              <Download className="h-3 w-3 text-muted-foreground" />
                           </div>
                        </td>
                      </tr>
                    ))}
                    {sortedReports.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No reports found</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="glass-card">
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   {[
                     { label: "General Settings", id: "general" },
                     { label: "Security & Password", id: "security" },
                     { label: "Active Sessions", id: "sessions" },
                     { label: "Account Actions", id: "advanced" }
                   ].map(item => (
                     <button 
                       key={item.id} 
                       onClick={() => setActiveSettingTab(item.id)}
                       className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${activeSettingTab === item.id ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:bg-white/5"}`}
                     >
                       {item.label}
                       <ChevronRight className="h-4 w-4 opacity-50" />
                     </button>
                   ))}
                 </div>
                 <div className="bg-surface/50 border border-border/50 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                    {activeSettingTab === "general" && <ProfileForm />}
                    {activeSettingTab === "security" && <ChangePasswordForm />}
                    {activeSettingTab === "sessions" && <ActiveSessions />}
                    {activeSettingTab === "advanced" && <AccountActions />}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
