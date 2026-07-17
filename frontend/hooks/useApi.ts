import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/errors";
import { useUIStore } from "@/store/ui.store";

// ─── useApiQuery ──────────────────────────────────────────────────────────

/**
 * Thin wrapper around useQuery that exposes a convenient `errorMessage` string.
 */
export function useApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, unknown, TData>, "queryKey" | "queryFn">
) {
  const query = useQuery<TData, unknown, TData>({
    queryKey,
    queryFn,
    ...options,
  });

  return {
    ...query,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  };
}

// ─── useApiMutation ───────────────────────────────────────────────────────

interface ApiMutationExtras {
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Thin wrapper around useMutation that auto-fires UI toasts on success/error.
 * React Query v5 removed onSuccess/onError from options; we use the returned
 * mutate callbacks instead via mutationOptions.
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, unknown, TVariables> & ApiMutationExtras
) {
  const { toastSuccess, toastError } = useUIStore();

  const {
    successMessage = "Operation completed successfully.",
    errorMessage: customErrorMsg,
    showSuccessToast = false,
    showErrorToast = true,
    ...restOptions
  } = options ?? {};

  const mutation = useMutation<TData, unknown, TVariables>({
    mutationFn,
    ...restOptions,
  });

  // Surface last error as a string
  const errorMessage = mutation.error
    ? (customErrorMsg ?? getErrorMessage(mutation.error))
    : null;

  /**
   * Wrapped mutate that fires toasts after settling.
   */
  const mutateWithToasts = async (
    variables: TVariables,
    callbacks?: {
      onSuccess?: (data: TData) => void;
      onError?: (err: unknown) => void;
    }
  ) => {
    try {
      const data = await mutation.mutateAsync(variables);
      if (showSuccessToast) toastSuccess("Success", successMessage);
      callbacks?.onSuccess?.(data);
      return data;
    } catch (err) {
      const msg = customErrorMsg ?? getErrorMessage(err);
      if (showErrorToast) toastError("Error", msg);
      callbacks?.onError?.(err);
      throw err;
    }
  };

  return {
    ...mutation,
    errorMessage,
    mutateWithToasts,
  };
}
