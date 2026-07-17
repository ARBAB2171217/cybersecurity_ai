import { api } from "@/lib/axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserAnalyticsSummary {
  totalScans: number;
  counterfeitCount: number;
  genuineCount: number;
  accuracyRate: number;
  counterfeitRate: number;
  byDenomination: Record<string, number>;
}

export const analyticsService = {
  /**
   * Fetches platform-wide analytics for Admin dashboard.
   */
  async getAdminDashboardStats(): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await api.get<ApiResponse<Record<string, unknown>>>("/analytics/dashboard");
    return res.data;
  },

  /**
   * Fetches per-citizen analytics for the User dashboard.
   * Endpoint: GET /analytics/me
   */
  async getUserStats(): Promise<ApiResponse<UserAnalyticsSummary>> {
    const res = await api.get<ApiResponse<UserAnalyticsSummary>>("/analytics/me");
    return res.data;
  },
};

export default analyticsService;
