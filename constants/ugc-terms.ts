/**
 * Per-user key so each account sees the UGC/terms gate once (App Store Guideline 1.2).
 * Do not use a single global key — otherwise the next user on the same device skips the modal.
 */
export function getUgcCommunityTermsStorageKey(
  userId: string | number | null | undefined
): string {
  const id = userId != null && String(userId).trim() !== "" ? String(userId) : "";
  return id ? `ugc_community_terms_v1_${id}` : "";
}
