import { API_CONFIG } from "@/constants/api";

/**
 * Full URL for React Native `Image`; relative storage paths use app origin;
 * ui-avatars is forced to PNG (SVG is not supported by RN Image).
 */
export function resolveProfilePhotoUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    if (u.includes("ui-avatars.com/api") && !/[?&]format=/.test(u)) {
      return `${u}${u.includes("?") ? "&" : "?"}format=png`;
    }
    return u;
  }
  const base = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}
