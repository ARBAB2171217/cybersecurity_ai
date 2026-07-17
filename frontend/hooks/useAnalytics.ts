import { useState, useEffect } from "react";
import { analyticsService } from "@/services/analytics.service";

/**
 * Hook for admin analytics dashboard.
 * Wraps the /analytics/dashboard endpoint which returns a flexible dict.
 * The AnalyticsDashboard component handles mapping the dict to its display.
 */
export function useAnalytics() {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getAdminDashboardStats();
      if (response.success && response.data) {
        setSummary(response.data as Record<string, unknown>);
      } else {
        setError(response.message || "Failed to load system metrics.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load system metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

export default useAnalytics;
