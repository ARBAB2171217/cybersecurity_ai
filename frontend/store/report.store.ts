import { create } from "zustand";
import reportService from "@/services/report.service";
import type { Report } from "@/types";
import type { ReportFilter, PaginatedReports } from "@/types/report";
import { getErrorMessage } from "@/utils/errors";

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  total: number;
  page: number;
  pages: number;
  filters: ReportFilter;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: string | null;
}

interface ReportActions {
  fetchReports: (filters?: ReportFilter) => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  setFilters: (filters: ReportFilter) => void;
  clearCurrentReport: () => void;
  clearError: () => void;
}

export const useReportStore = create<ReportState & ReportActions>()(
  (set, get) => ({
    // ── State
    reports: [],
    currentReport: null,
    total: 0,
    page: 1,
    pages: 1,
    filters: { page: 1, limit: 10 },
    isLoading: false,
    isLoadingDetail: false,
    error: null,

    // ── Actions
    fetchReports: async (filters) => {
      const merged = { ...get().filters, ...filters };
      set({ isLoading: true, error: null, filters: merged });
      try {
        const res = await reportService.getReports(merged);
        if (res.success && res.data) {
          set({
            reports: res.data.reports ?? [],
            total: res.data.total,
            page: res.data.page,
            pages: res.data.pages,
          });
        }
      } catch (err) {
        set({ error: getErrorMessage(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchReportById: async (id) => {
      set({ isLoadingDetail: true, error: null });
      try {
        const res = await reportService.getReportById(id);
        if (res.success) set({ currentReport: res.data });
      } catch (err) {
        set({ error: getErrorMessage(err) });
      } finally {
        set({ isLoadingDetail: false });
      }
    },

    deleteReport: async (id) => {
      // Optimistic removal
      const previous = get().reports;
      set((state) => ({
        reports: (state.reports ?? []).filter((r) => r.id !== id),
        total: Math.max(0, state.total - 1),
      }));
      try {
        await reportService.deleteReport(id);
      } catch (err) {
        // Rollback
        set({ reports: previous, error: getErrorMessage(err) });
        throw err;
      }
    },

    setFilters: (filters) =>
      set((state) => ({ filters: { ...state.filters, ...filters } })),

    clearCurrentReport: () => set({ currentReport: null }),
    clearError: () => set({ error: null }),
  })
);
