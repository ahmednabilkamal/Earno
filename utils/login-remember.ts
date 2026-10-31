import { storage } from "./storage";

/** Stores the last successful mobile number (digits or national form as entered). */
export const LOGIN_REMEMBERED_PHONE_KEY = "login_remembered_phone";

/** Legacy key from email-based login; migrated once on read. */
const LOGIN_REMEMBERED_EMAIL_KEY_LEGACY = "login_remembered_email";

export async function getRememberedLoginPhone(): Promise<string | null> {
  try {
    const next = await storage.getItem(LOGIN_REMEMBERED_PHONE_KEY);
    if (next?.trim()) return next.trim();
    const legacy = await storage.getItem(LOGIN_REMEMBERED_EMAIL_KEY_LEGACY);
    if (legacy?.trim() && !legacy.includes("@")) {
      await storage.setItem(LOGIN_REMEMBERED_PHONE_KEY, legacy.trim());
      await storage.removeItem(LOGIN_REMEMBERED_EMAIL_KEY_LEGACY);
      return legacy.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function setRememberedLoginPhone(phone: string | null): Promise<void> {
  try {
    if (phone?.trim()) {
      await storage.setItem(LOGIN_REMEMBERED_PHONE_KEY, phone.trim());
    } else {
      await storage.removeItem(LOGIN_REMEMBERED_PHONE_KEY);
    }
  } catch {
    /* best-effort */
  }
}
