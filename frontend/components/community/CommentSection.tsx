"use client";

import React from "react";

export function CommentSection({ reportId }: { reportId: string }) {
  return (
    <div className="p-4 border rounded-xl bg-card">
      <p className="text-muted-foreground text-sm">Comments coming soon for report {reportId}</p>
    </div>
  );
}
