import ImgToBase64 from "react-native-image-base64";

/**
 * Converts a local file URI or data-URL image string to raw base64 (no `data:image/...;base64,` prefix)
 * for JSON APIs that expect base64-encoded image bytes.
 */
export async function imageSourceToRawBase64(source: string): Promise<string | null> {
  try {
    if (!source || typeof source !== "string") return null;
    const img = source.trim();
    if (img.startsWith("data:image")) {
      const parts = img.split(",");
      if (parts.length > 1 && parts[1].length > 0) return parts[1];
      const commaIndex = img.indexOf(",");
      if (commaIndex !== -1 && commaIndex < img.length - 1) {
        return img.substring(commaIndex + 1);
      }
    }
    if (
      img.startsWith("file://") ||
      img.startsWith("content://") ||
      img.startsWith("/")
    ) {
      const base64String = await ImgToBase64.getBase64String(img);
      return base64String && base64String.length > 0 ? base64String : null;
    }
    return img.length > 0 ? img : null;
  } catch {
    return null;
  }
}

export async function imageSourcesToRawBase64(sources: string[]): Promise<string[]> {
  const results = await Promise.all(sources.map((s) => imageSourceToRawBase64(s)));
  return results.filter((r): r is string => typeof r === "string" && r.length > 0);
}
