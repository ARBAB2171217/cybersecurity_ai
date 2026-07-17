"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ShieldCheck, ShieldAlert, Users, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function AdminDashboardPage() {
  const stats = {
    activeCitizens: 1204,
    flaggedCounterfeits: 58,
    pendingVerifications: 12,
    systemUptime: "99.98%"
  };

  return (
    <PageContainer>
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel" }, { label: "Overview" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          Administrative Center
        </h1>
        <p className="text-xs text-muted-foreground">
          System telemetry controls, user directories, and classification incident audit records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Citizens</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{stats.activeCitizens}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Registered OTP verified profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Counterfeits Flagged</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{stats.flaggedCounterfeits}</div>
            <p className="text-[10px] text-destructive/80 mt-1">Banknote classification failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Approval</CardTitle>
            <Bell className="h-4 w-4 text-primary animate-bounce" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{stats.pendingVerifications}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Requires manual review queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Accuracy</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400">{stats.systemUptime}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average pipeline availability uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Management Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={ROUTES.ADMIN.USERS}>
              <Button className="w-full text-xs font-semibold" variant="outline">
                Citizen Directory
              </Button>
            </Link>
            <Link href={ROUTES.ADMIN.REPORTS}>
              <Button className="w-full text-xs font-semibold" variant="outline">
                Reports Review Queue
              </Button>
            </Link>
            <Link href={ROUTES.ADMIN.ANALYTICS}>
              <Button className="w-full text-xs font-semibold" variant="outline">
                System Telemetry
              </Button>
            </Link>
            <Link href={ROUTES.ADMIN.AUDIT_LOGS}>
              <Button className="w-full text-xs font-semibold" variant="outline">
                Audit Trail Log
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">Environment</span>
              <span className="font-bold text-foreground">Production Stage</span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-2">
              <span className="text-muted-foreground font-semibold">FastAPI Engine</span>
              <span className="font-bold text-foreground">v0.110.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Build Status</span>
              <span className="font-bold text-emerald-400">STABLE</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
