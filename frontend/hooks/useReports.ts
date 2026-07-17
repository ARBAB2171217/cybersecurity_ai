import { useState, useEffect, useCallback } from "react";
import { reportService } from "@/services/report.service";
import { Report } from "@/types";
import { ReportFilter } from "@/types/report";

export function useReports(initialFilters: ReportFilter = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState<ReportFilter>({ page: 1, limit: 10, ...initialFilters });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportService.getReports(filters);
      if (response.success && response.data) {
        setReports(response.data.reports);
        setTotal(response.data.total);
        setPages(response.data.pages);
      } else {
        setError(response.message || "Failed to load reports.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilters = (newFilters: Partial<ReportFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }));
  };

  const deleteReport = async (id: string) => {
    try {
      await reportService.deleteReport(id);
      fetchReports();
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete report.");
    }
  };

  return {
    reports,
    total,
    pages,
    filters,
    isLoading,
    error,
    updateFilters,
    deleteReport,
    refetch: fetchReports,
  };
}
export default useReports;
