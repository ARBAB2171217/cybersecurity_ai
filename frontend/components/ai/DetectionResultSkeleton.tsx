"use client";

import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Full-page skeleton for the AI detection result while data is loading.
 */
export function DetectionResultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Verdict hero card */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Action bar */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Two-column main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left large column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scores row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
          {/* Security features */}
          <Skeleton className="h-72 rounded-2xl" />
          {/* OCR */}
          <Skeleton className="h-48 rounded-2xl" />
          {/* Reasons */}
          <Skeleton className="h-56 rounded-2xl" />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
export default DetectionResultSkeleton;
