import { Report } from "./index";

export interface ReportFilter {
  search?: string;
  denomination?: string;
  isCounterfeit?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  visibility?: "PUBLIC" | "PRIVATE" | "ANONYMOUS";
  category?: string;
  sortBy?: "recent" | "popular" | "trending" | "confirmed";
  qrType?: string;
  threatLevel?: string;
  riskScore?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedReports {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
}
