import { ApiLikeError } from "../types";

export const asRecord = (
  value: unknown
): Record<string, unknown> | null =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

export const pickBoolean = (
  source: Record<string, unknown> | null,
  keys: string[]
): boolean | undefined => {
  if (!source) return undefined;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }

  return undefined;
};

export const getApiError = (error: unknown): ApiLikeError | null =>
  asRecord(error) as ApiLikeError | null;

export const getErrorMessage = (error: unknown): string | undefined => {
  const apiError = getApiError(error);
  return apiError?.response?.data?.message || apiError?.message || undefined;
};
