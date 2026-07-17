"use client";

import { useEffect, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { reports, total, isLoading, updateFilters, filters } = useReports({
    visibility: "PUBLIC",
    sortBy: "trending",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cyber Intelligence Community</h1>
          <p className="text-muted-foreground mt-1">
            Stay aware. Share knowledge. Confirm scams securely.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[250px]"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto">
        <Button
          variant={filters.sortBy === "trending" ? "default" : "outline"}
          onClick={() => updateFilters({ sortBy: "trending" })}
        >
          🔥 Trending
        </Button>
        <Button
          variant={filters.sortBy === "recent" ? "default" : "outline"}
          onClick={() => updateFilters({ sortBy: "recent" })}
        >
          🕒 Most Recent
        </Button>
        <Button
          variant={filters.sortBy === "popular" ? "default" : "outline"}
          onClick={() => updateFilters({ sortBy: "popular" })}
        >
          ⭐ Most Popular
        </Button>
        <Button
          variant={filters.sortBy === "confirmed" ? "default" : "outline"}
          onClick={() => updateFilters({ sortBy: "confirmed" })}
        >
          ✅ Most Confirmed
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-card">
          <h3 className="text-lg font-medium">No community posts found.</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <CommunityPostCard key={report.id} report={report} />
          ))}
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => updateFilters({ page: (filters.page || 1) - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Total {total} Reports
            </span>
            <Button
              variant="outline"
              disabled={reports.length < (filters.limit || 10)}
              onClick={() => updateFilters({ page: (filters.page || 1) + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
