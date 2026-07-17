import { api } from "@/lib/axios";
import type { Report } from "@/types";
import type { ReportFilter, PaginatedReports } from "@/types/report";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const reportService = {
  /**
   * Fetches the authenticated citizen's own reports with optional filtering.
   * Backend now returns data: { reports, total, page, pages } inside StandardResponse.
   */
  async getReports(filters: ReportFilter = {}): Promise<ApiResponse<PaginatedReports>> {
    const params: Record<string, string | number | boolean> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.size = filters.limit;
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status_val = filters.status;
    if (filters.isCounterfeit !== undefined) params.is_counterfeit = filters.isCounterfeit;
    if (filters.denomination) params.denomination = parseInt(filters.denomination, 10);
    if (filters.category) params.category = filters.category;
    if (filters.qrType) params.qr_type = filters.qrType;
    if (filters.threatLevel) params.threat_level = filters.threatLevel;
    if (filters.riskScore !== undefined) params.risk_score = filters.riskScore;

    const res = await api.get<ApiResponse<PaginatedReports>>("/reports", { params });
    return res.data;
  },

  /**
   * Fetches a single report by ID.
   */
  async getReportById(id: string): Promise<ApiResponse<Report>> {
    const res = await api.get<ApiResponse<Report>>(`/reports/${id}`);
    return res.data;
  },

  /**
   * Deletes a report the citizen owns.
   */
  async deleteReport(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/reports/${id}`);
    return res.data;
  },
};

export default reportService;
