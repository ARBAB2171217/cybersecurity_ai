"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useReportStore } from "@/store/report.store";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DetectionHistoryWidget() {
  const { reports, isLoading } = useReportStore();

  const safeReports = reports ?? [];
  const recentReports = safeReports.slice(0, 5);

  return (
    <Card className="flex flex-col h-full border-white/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Detections</CardTitle>
        <Link href={ROUTES.REPORTS}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading && safeReports.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800/50 rounded-lg w-full" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <Search className="h-10 w-10 opacity-20 mb-3" />
            <p className="text-sm font-semibold">No detections yet</p>
            <p className="text-xs opacity-70">Upload a banknote to see history.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {recentReports.map((report) => (
              <Link 
                key={report.id} 
                href={ROUTES.DETECTION_RESULT(report.id)}
                className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-zinc-900/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${report.isCounterfeit ? 'bg-destructive' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      ₹{report.denomination} Note
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.serialNumber || 'Unknown Serial'} · {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant={report.isCounterfeit ? "destructive" : "success"}>
                  {report.isCounterfeit ? "FAKE" : "GENUINE"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default DetectionHistoryWidget;
