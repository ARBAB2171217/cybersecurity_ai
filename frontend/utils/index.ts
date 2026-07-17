/**
 * Formats a numeric value into a standard Indian Rupee currency representation.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats an ISO timestamp string into a readable date-time representation.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Calculates a percentage string from a float confidence score (0.0 - 1.0).
 */
export function formatConfidence(score?: number): string {
  if (score === undefined || score === null) return "N/A";
  return `${(score * 100).toFixed(1)}%`;
}
