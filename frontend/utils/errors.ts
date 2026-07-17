import { AxiosError } from "axios";

// ─── Standard API Error Shape ──────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  field?: string;       // For validation errors targeting a specific field
  code?: string;        // Machine-readable error code from backend
  details?: unknown;    // Raw error payload for debugging
}

// ─── Error Code Enum ───────────────────────────────────────────────────────

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ─── User-Facing Error Messages ────────────────────────────────────────────

const HTTP_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "A conflict occurred. The resource may already exist.",
  422: "Validation failed. Please review your submission.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "An internal server error occurred. Please try again later.",
  502: "Service temporarily unavailable. Please try again later.",
  503: "Service under maintenance. Please try again later.",
};

// ─── Core Parser ──────────────────────────────────────────────────────────

/**
 * Parses any caught error (Axios, standard Error, unknown) into a typed ApiError.
 */
export function parseError(error: unknown): ApiError {
  // Axios errors with response body
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const responseData = error.response?.data as any;

    let message = responseData?.message;
    if (!message) {
      if (typeof responseData?.detail === "string") {
        message = responseData.detail;
      } else if (Array.isArray(responseData?.detail)) {
        // Format FastAPI Pydantic validation errors nicely
        message = responseData.detail.map((err: any) => {
          const fieldName = err.loc && err.loc.length > 1 ? err.loc.slice(1).join(".") : (err.loc ? err.loc.join(".") : "");
          return fieldName ? `${fieldName}: ${err.msg}` : err.msg;
        }).join(" | ");
      } else {
        message = HTTP_MESSAGES[status] || error.message || "An unexpected error occurred.";
      }
    }

    const code = deriveErrorCode(status);

    return {
      status,
      message,
      code,
      field: responseData?.field,
      details: responseData,
    };
  }

  // Network / timeout errors (no response)
  if (error instanceof Error) {
    if (
      error.message.includes("Network Error") ||
      error.message.includes("timeout") ||
      error.message.includes("ERR_NETWORK")
    ) {
      return {
        status: 0,
        message: "Network error. Please check your internet connection.",
        code: ERROR_CODES.NETWORK_ERROR,
      };
    }
    return {
      status: 0,
      message: error.message || "An unexpected error occurred.",
      code: ERROR_CODES.UNKNOWN,
    };
  }

  return {
    status: 0,
    message: "An unknown error occurred.",
    code: ERROR_CODES.UNKNOWN,
  };
}

/**
 * Extracts a clean user-facing error message string from any error.
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}

/**
 * Returns true if the error is a 401 Unauthorized.
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Returns true if the error is a 403 Forbidden.
 */
export function isForbiddenError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Returns true if the error is a network/connectivity failure.
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error) && !error.response) return true;
  if (error instanceof Error) {
    return (
      error.message.includes("Network Error") ||
      error.message.includes("ERR_NETWORK")
    );
  }
  return false;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

function deriveErrorCode(status: number): ErrorCode {
  switch (status) {
    case 401: return ERROR_CODES.UNAUTHORIZED;
    case 403: return ERROR_CODES.FORBIDDEN;
    case 404: return ERROR_CODES.NOT_FOUND;
    case 422: return ERROR_CODES.VALIDATION_ERROR;
    case 429: return ERROR_CODES.RATE_LIMITED;
    case 500:
    case 502:
    case 503: return ERROR_CODES.SERVER_ERROR;
    default:  return ERROR_CODES.UNKNOWN;
  }
}
