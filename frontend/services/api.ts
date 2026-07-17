// ─── Shared Response Envelope ─────────────────────────────────────────────
// All backend endpoints return { success, message, data }

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Paginated Wrapper ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ─── Common Pagination Params ─────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Re-export for consumers ──────────────────────────────────────────────

export type { ApiResponse as StandardResponse };
