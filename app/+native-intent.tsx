import * as Linking from "expo-linking";

function firstQueryParam(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Route project share links through /p/{id} bridge → /home → project-details
 * so the back stack is always [home, project-details].
 */
function rewriteProjectDeepLink(url: string): string | null {
  const parsed = Linking.parse(url);
  const scheme = typeof parsed.scheme === "string" ? parsed.scheme.toLowerCase() : "";
  const hostname =
    typeof parsed.hostname === "string" ? parsed.hostname.replace(/^\/+/, "").toLowerCase() : "";
  const path = typeof parsed.path === "string" ? parsed.path.replace(/^\/+/, "") : "";
  const normalizedPath = path || hostname;

  if (!normalizedPath) return null;

  const toBridge = (projectId: string, slug?: string | null) =>
    slug ? `/p/${projectId}/${slug}` : `/p/${projectId}`;

  if (scheme === "earno" && normalizedPath === "project-details") {
    const projectId = firstQueryParam(parsed.queryParams?.id as string | string[] | undefined);
    return projectId ? toBridge(projectId) : null;
  }

  const legacyCustomMatch = normalizedPath.match(/^lp\/(\d+)(?:\/([^/?#]+))?$/i);
  if (legacyCustomMatch) {
    return toBridge(legacyCustomMatch[1], legacyCustomMatch[2] ?? null);
  }

  const publicMatch = normalizedPath.match(/^p\/(\d+)(?:\/([^/?#]+))?$/i);
  if (publicMatch) {
    return toBridge(publicMatch[1], publicMatch[2] ?? null);
  }

  return null;
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return rewriteProjectDeepLink(path) ?? path;
  } catch {
    return path;
  }
}
