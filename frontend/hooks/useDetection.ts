import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { uploadService, type UploadPayload } from "@/services/upload.service";
import { useDetectionStore } from "@/store/detection.store";
import { ROUTES } from "@/lib/constants";
import { getErrorMessage } from "@/utils/errors";

/**
 * useDetection — React Query mutation hook for the currency scan flow.
 *
 * Wraps the Zustand detection store's `analyze` action inside a
 * React Query `useMutation` so callers get:
 *   - isLoading (mutation in flight)
 *   - isError + error
 *   - isSuccess
 *   - mutate(payload) / mutateAsync(payload)
 *
 * On success the hook navigates to the detection-result page automatically.
 * The Zustand store is the single source of truth for progress + raw result.
 */
export function useDetection() {
  const router = useRouter();
  const { analyze, status, progress, error: storeError, reset } = useDetectionStore();

  const mutation = useMutation<string | null, Error, UploadPayload>({
    mutationKey: ["detection", "scan"],

    mutationFn: async (payload: UploadPayload): Promise<string | null> => {
      return analyze(payload.file, payload.denomination, payload.serialNumber);
    },

    onSuccess: (reportId) => {
      if (reportId) {
        router.push(ROUTES.DETECTION_RESULT(reportId));
      }
    },

    onError: (err) => {
      // Error is already captured in the Zustand store by the `analyze` action.
      // Nothing extra to do here; the UI reads from `storeError`.
      console.error("[useDetection] scan failed:", getErrorMessage(err));
    },
  });

  return {
    // ── Mutation controls
    scan: mutation.mutate,
    scanAsync: mutation.mutateAsync,
    reset,

    // ── Status flags (prefer Zustand store for granular upload/processing states)
    isIdle: status === "idle",
    isUploading: status === "uploading",
    isProcessing: status === "processing",
    isSuccess: status === "success",
    isError: status === "error",

    // ── Progress + error
    progress,
    error: storeError ?? (mutation.error ? getErrorMessage(mutation.error) : null),

    // ── React Query native flags (for compatibility with React Query devtools)
    isPending: mutation.isPending,
  };
}

export default useDetection;
