"use client";

import { useEffect, useState } from "react";
import { communityService } from "@/services/community.service";
import { Report } from "@/types";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { Loader2, Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await communityService.getBookmarks();
        if (res.success && res.data) {
          setReports(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-primary" /> Saved Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Reports and posts you have bookmarked for later.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-card">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No bookmarks yet.</h3>
          <p className="text-muted-foreground mt-2">Save reports to view them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <CommunityPostCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
