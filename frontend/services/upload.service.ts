import { api } from "@/lib/axios";
import type { Denomination } from "@/lib/constants";
import type { Report } from "@/types";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UploadPayload {
  file: File;
  denomination?: Denomination;
  serialNumber?: string;
}

export const uploadService = {
  /**
   * Uploads a banknote image and triggers the AI detection pipeline.
   * Calls POST /detection/analyze (multipart/form-data).
   * Backend returns StandardResponse[ReportResponse] with camelCase fields.
   */
  async detectCurrency(payload: UploadPayload): Promise<ApiResponse<Report>> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.denomination) {
        formData.append("denomination", String(payload.denomination));
    }
    if (payload.serialNumber) {
      formData.append("serial_number", payload.serialNumber);
    }

    const res = await api.post<ApiResponse<Report>>(
      "/scanner/scan",
      formData,
      {
        // Long timeout for AI pipeline processing (Gemini can be slow)
        timeout: 180_000,
        headers: { "Content-Type": "multipart/form-data" }
      }
    );
    return res.data;
  },
};

export default uploadService;
