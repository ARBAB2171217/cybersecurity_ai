"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reportService } from "@/services/report.service";
import { Report } from "@/types";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommentSection } from "@/components/community/CommentSection";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await reportService.getReportById(params.id as string);
        if (res.success && res.data) {
          setReport(res.data);
        } else {
          setError(res.message || "Failed to load report.");
        }
      } catch (err: any) {
        setError("Report not found or access denied.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="text-center py-20 border rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
          <h3 className="text-lg font-medium">{error || "Report not found"}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <CommunityPostCard report={report} detailed />
      
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-6">Discussions ({report.commentsCount || 0})</h3>
        <CommentSection reportId={report.id} />
      </div>
    </div>
  );
}
