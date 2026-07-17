"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useReportStore } from "@/store/report.store";
import { useEffect, useMemo } from "react";
import { Activity, AlertTriangle, ShieldCheck, FileText } from "lucide-react";

export function ReportStatistics() {
  const { reports, fetchReports, isLoading } = useReportStore();

  const safeReports = reports ?? [];

  useEffect(() => {
    if (safeReports.length === 0 && !isLoading) {
      fetchReports();
    }
  }, [fetchReports, safeReports.length, isLoading]);

  const stats = useMemo(() => {
    const total = safeReports.length;
    const genuine = safeReports.filter((r) => r?.isCounterfeit === false).length;
    const counterfeit = safeReports.filter((r) => r?.isCounterfeit === true).length;
    const pending = total - genuine - counterfeit;

    return [
      {
        label: "Total Scans",
        value: total,
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        label: "Genuine Notes",
        value: genuine,
        icon: ShieldCheck,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        label: "Counterfeits Detected",
        value: counterfeit,
        icon: AlertTriangle,
        color: "text-destructive",
        bg: "bg-destructive/10",
      },
      {
        label: "Pending Verification",
        value: pending,
        icon: Activity,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
    ];
  }, [reports]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <h4 className="text-2xl font-black text-foreground mt-0.5">
                {isLoading && safeReports.length === 0 ? "-" : stat.value}
              </h4>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export default ReportStatistics;
