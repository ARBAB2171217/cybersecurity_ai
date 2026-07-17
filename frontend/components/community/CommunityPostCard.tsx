"use client";

import { Report } from "@/types";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Heart, MessageSquare, Bookmark, Eye, Share2, AlertTriangle, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { communityService } from "@/services/community.service";
import { useToast } from "@/components/ui/Toast";

interface Props {
  report: Report;
  detailed?: boolean;
}

export function CommunityPostCard({ report, detailed = false }: Props) {
  const { addToast } = useToast();
  const [liked, setLiked] = useState(report.isLiked || false);
  const [likesCount, setLikesCount] = useState(report.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(report.isBookmarked || false);
  const [bookmarksCount, setBookmarksCount] = useState(report.bookmarksCount || 0);
  
  const handleLike = async () => {
    try {
      const res = await communityService.toggleLike(report.id);
      if (res.success && res.data) {
        setLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch (err) {
      addToast({ type: "error", title: "Error", description: "Failed to like post" });
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await communityService.toggleBookmark(report.id);
      if (res.success && res.data) {
        setBookmarked(res.data.bookmarked);
        setBookmarksCount(res.data.bookmarksCount);
        addToast({ type: "success", title: res.data.bookmarked ? "Saved" : "Removed", description: "Bookmark updated." });
      }
    } catch (err) {
      addToast({ type: "error", title: "Error", description: "Failed to bookmark post" });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/${report.id}`;
    navigator.clipboard.writeText(url);
    addToast({ type: "success", title: "Link Copied", description: "Report URL copied to clipboard." });
  };

  const author = report.visibility === "ANONYMOUS" ? "Anonymous User" : (report.authorName || "Citizen User");

  return (
    <div className="border rounded-xl bg-card p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Link href={`/community/${report.id}`}>
            <h2 className="text-xl font-semibold hover:text-primary transition-colors">
              {report.title || `Report #${report.id.substring(0,8)}`}
            </h2>
          </Link>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">{author}</span> • 
            <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
            {report.category && <Badge variant="secondary">{report.category}</Badge>}
            {report.priority === "HIGH" && <Badge variant="destructive">High Priority</Badge>}
          </div>
        </div>
        
        {report.imageUrl && !detailed && (
          <img src={report.imageUrl} alt="Evidence" className="h-16 w-16 object-cover rounded-md border" />
        )}
      </div>

      <div className={`text-sm ${!detailed && "line-clamp-3 text-muted-foreground"}`}>
        {report.description || "No description provided."}
      </div>

      {detailed && report.imageUrl && (
        <div className="mt-4">
          <img src={report.imageUrl} alt="Evidence Full" className="w-full max-h-96 object-contain rounded-lg border bg-muted" />
        </div>
      )}

      {detailed && report.ocrText && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm border">
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Search className="h-4 w-4"/> Extracted Text</h4>
          <p className="whitespace-pre-wrap">{report.ocrText}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className={`gap-2 ${liked ? "text-red-500 hover:text-red-600" : ""}`} onClick={handleLike}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> 
            {likesCount}
          </Button>
          <Link href={`/community/${report.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" /> 
              {report.commentsCount || 0}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
            <Eye className="h-4 w-4" /> 
            {report.viewsCount || 0}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleBookmark} className={bookmarked ? "text-primary" : ""}>
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

