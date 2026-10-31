/**
 * Detects if an error is a network or server (backend/database) error.
 * Used to show the dedicated network error screen with retry.
 */
export function isNetworkOrServerError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as {
    code?: string;
    message?: string;
    response?: { status?: number };
  };

  // Network-level errors (no response received)
  const networkCodes = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ERR_NETWORK",
    "ECONNABORTED",
    "ERR_CONNECTION_REFUSED",
    "ERR_CONNECTION_RESET",
  ];
  if (err.code && networkCodes.includes(err.code)) return true;

  // Axios "Network Error" message (often when backend is unreachable)
  if (typeof err.message === "string" && err.message.toLowerCase().includes("network error"))
    return true;

  // Server errors (5xx = backend/database down)
  const status = err.response?.status;
  if (typeof status === "number" && status >= 500) return true;

  return false;
}
