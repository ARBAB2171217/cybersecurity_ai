import { useState, useCallback } from "react";

interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalPages?: number;
}

interface PaginationState {
  page: number;
  limit: number;
}

interface PaginationActions {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

/**
 * Manages client-side pagination state.
 * Pass the current `totalPages` from your data fetch to enable
 * boundary-safe next/prev navigation.
 */
export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalPages = 1,
}: PaginationOptions = {}): PaginationState & PaginationActions {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const setPage = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(p, totalPages));
      setPageState(clamped);
    },
    [totalPages]
  );

  const setLimit = useCallback((l: number) => {
    setLimitState(Math.max(1, l));
    setPageState(1); // Reset to first page on limit change
  }, []);

  const nextPage = useCallback(
    () => setPage(page + 1),
    [page, setPage]
  );

  const prevPage = useCallback(
    () => setPage(page - 1),
    [page, setPage]
  );

  const firstPage = useCallback(() => setPageState(1), []);

  const lastPage = useCallback(
    () => setPageState(totalPages),
    [totalPages]
  );

  const reset = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
    canGoNext: page < totalPages,
    canGoPrev: page > 1,
  };
}
