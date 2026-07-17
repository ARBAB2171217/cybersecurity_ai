import { api } from "@/lib/axios";
import type { Report } from "@/types";
import type { Denomination } from "@/lib/constants";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ScanPayload {
  file: File;
  denomination: Denomination;
  serialNumber?: string;
}

/**
 * detectionService — API layer for the AI currency detection endpoints.
 *
 * POST /detection/analyze  — upload image + run AI pipeline → returns Report
 * GET  /detection/:id      — fetch a completed report by ID
 */
export const detectionService = {
  /**
   * Uploads a banknote image and triggers the full AI detection pipeline.
   * Uses multipart/form-data. The backend returns StandardResponse[ReportResponse].
   * Timeout is set to 3 minutes to accommodate slow Gemini API calls.
   */
  async scanCurrency(payload: ScanPayload): Promise<ApiResponse<Report>> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("denomination", String(payload.denomination));
    if (payload.serialNumber?.trim()) {
      formData.append("serial_number", payload.serialNumber.trim());
    }

    const res = await api.post<ApiResponse<Report>>(
      "/scanner/scan",
      formData,
      {
        timeout: 180_000, // 3-minute timeout for OCR + Gemini pipeline
        headers: { "Content-Type": "multipart/form-data" }
      }
    );
    return res.data;
  },

  /**
   * Fetches a previously completed detection result by its report UUID.
   * Called by the detection-result/[reportId] page on hard refresh.
   */
  async getDetectionResult(reportId: string): Promise<ApiResponse<Report>> {
    const res = await api.get<ApiResponse<Report>>(`/detection/${reportId}`);
    return res.data;
  },

  /**
   * Feature 8: Interacts with the AI Assistant for a specific report.
   */
  async askAssistant(reportId: string, question: string): Promise<ApiResponse<string>> {
    const res = await api.post<ApiResponse<string>>(`/detection/${reportId}/ask`, { question });
    return res.data;
  },
};

export default detectionService;
