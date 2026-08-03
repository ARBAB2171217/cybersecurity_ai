import { create } from "zustand";
import uploadService from "@/services/upload.service";
import detectionService from "@/services/detection.service";
import type { Report } from "@/types";
import type { Denomination } from "@/lib/constants";
import { getErrorMessage } from "@/utils/errors";

type DetectionStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface DetectionState {
  result: Report | null;
  status: DetectionStatus;
  progress: number;       // 0-100 upload/processing progress
  error: string | null;
}

interface DetectionActions {
  analyze: (file: File, denomination?: Denomination, serialNumber?: string) => Promise<string | null>;
  fetchResult: (reportId: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const useDetectionStore = create<DetectionState & DetectionActions>()(
  (set, get) => ({
    // ── State
    result: null,
    status: "idle",
    progress: 0,
    error: null,

    // ── Actions
    analyze: async (file, denomination, serialNumber) => {
      set({ status: "uploading", progress: 10, result: null, error: null });

      try {
        // Simulate staged progress for UX while waiting on the AI pipeline
        set({ progress: 30 });

        const res = await uploadService.detectCurrency({ file, denomination, serialNumber });

        set({ progress: 90, status: "processing" });

        if (res.success && res.data) {
          set({ result: res.data, status: "success", progress: 100 });
          // Return the reportId so the caller can navigate to the result page
          const reportId = res.data.report_id ?? res.data.id;
          
          // Immediately fetch the fully hydrated database record so the UI has all fields (like evidenceType)
          if (reportId) {
            await get().fetchResult(reportId);
          }
          
          if (!reportId) {
              console.error(
                  "[Universal Scanner] Backend returned no report identifier.",
                  res.data
              );
              throw new Error(
                  "Universal Scanner completed but no report identifier was returned."
              );
          }
          
          return reportId;
        } else {
          throw new Error(res.message || "Detection pipeline returned an error.");
        }
      } catch (err) {
        set({ status: "error", error: getErrorMessage(err), progress: 0 });
        throw err;
      }
    },

    fetchResult: async (reportId) => {
      set({ status: "processing", error: null });
      try {
        const res = await detectionService.getDetectionResult(reportId);
        if (res.success && res.data) {
          set({ result: res.data, status: "success" });
        } else {
          set({ status: "error", error: res.message || "Could not load detection result." });
        }
      } catch (err) {
        set({ status: "error", error: getErrorMessage(err) });
      }
    },

    reset: () => set({ result: null, status: "idle", progress: 0, error: null }),
    clearError: () => set({ error: null }),
  })
);
