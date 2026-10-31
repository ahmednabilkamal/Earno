/**
 * Count / year / integer fields. Accepts "033" (same as 33) without parseInt-octal edge cases;
 * use instead of parseInt when building API payloads and client-side checks.
 */
export function parseCountField(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) {
    return Number.NaN;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  const t = String(raw)
    .trim()
    .replace(/[\s,]/g, "");
  if (t === "") {
    return Number.NaN;
  }
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : Number.NaN;
}
