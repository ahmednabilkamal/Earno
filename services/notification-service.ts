import { API_CONFIG } from "../constants/api";
import { REALTIME_CONFIG } from "../constants/realtime";
import apiClient from "../utils/api";

export interface UnreadCountResponse {
  count: number;
}

/** Normalized in-app notification for the list UI */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  /** Raw payload for future deep links (e.g. project_id) */
  data?: Record<string, unknown>;
}

export interface NotificationLongPollOptions {
  intervalMs?: number;
}

export interface NotificationPreferences {
  push_notifications: boolean;
}

function normalizeUnreadCount(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const p = payload as Record<string, unknown>;

  if (typeof p.count === "number") return p.count;
  if (typeof p.unread_count === "number") return p.unread_count;

  const data = p.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (typeof d.count === "number") return d.count;
    if (typeof d.unread_count === "number") return d.unread_count;
  }

  return 0;
}

/**
 * Laravel list response is often:
 * `{ "success": true, "data": { "data": [...], "current_page": 1, ... } }`
 * (paginator inside `data`). This extracts the inner notification rows array.
 */
function extractNotificationRows(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const p = payload as Record<string, unknown>;

  // Envelope: { success, data: paginator }
  const outer = p.data;
  if (outer && typeof outer === "object" && !Array.isArray(outer)) {
    const paginator = outer as Record<string, unknown>;
    if (Array.isArray(paginator.data)) return paginator.data;
  }

  // Paginator alone: { data: [...], current_page, per_page, ... }
  if (Array.isArray(p.data)) return p.data;

  if (Array.isArray(p.notifications)) return p.notifications;

  const resp = p.response as Record<string, unknown> | undefined;
  if (resp?.data && Array.isArray(resp.data)) return resp.data as unknown[];

  return [];
}

function parseNotificationDataPayload(
  raw: unknown
): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function normalizeNotificationsList(payload: unknown): AppNotification[] {
  const raw = extractNotificationRows(payload);
  if (!Array.isArray(raw)) return [];

  return raw.map((n, index) => {
    const row = n as Record<string, unknown>;
    const rowData = parseNotificationDataPayload(row.data);
    const id = row.id ?? row.uuid ?? row.notification_id ?? index;
    const title =
      String(
        row.title ??
          row.subject ??
          row.message ??
          rowData?.title ??
          rowData?.subject ??
          rowData?.message ??
          row.body ??
          rowData?.body ??
          ""
      ).trim() || String(row.body ?? rowData?.body ?? "");
    const body = String(
      row.body ??
        row.message ??
        row.description ??
        row.content ??
        rowData?.body ??
        rowData?.message ??
        rowData?.description ??
        rowData?.content ??
        ""
    ).trim();
    const isRead = Boolean(
      row.is_read === true ||
        row.read === true ||
        row.read === 1 ||
        row.status === "read" ||
        (row.read_at != null && String(row.read_at).length > 0)
    );
    const createdAt = String(
      row.created_at ?? row.createdAt ?? row.sent_at ?? row.updated_at ?? ""
    );
    return {
      id: String(id),
      title: title || body.slice(0, 120) || "",
      body: body && body !== title ? body : "",
      isRead,
      createdAt,
      data: rowData,
    };
  });
}

export const notificationService = {
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT
      );
      return {
        count: normalizeUnreadCount(response.data),
      };
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      return { count: 0 };
    }
  },

  /**
   * GET /notifications — list notifications for the current user.
   */
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
    return normalizeNotificationsList(response.data);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/preferences`
    );
    const data =
      response?.data && typeof response.data === "object"
        ? (response.data as Record<string, unknown>).data
        : undefined;
    const prefs =
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};

    return {
      push_notifications: prefs.push_notifications !== false,
    };
  },

  updatePreferences: async (
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put(
      `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/preferences`,
      updates
    );
    const data =
      response?.data && typeof response.data === "object"
        ? (response.data as Record<string, unknown>).data
        : undefined;
    const prefs =
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};

    return {
      push_notifications: prefs.push_notifications !== false,
    };
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/mark-all-as-read`);
  },

  watchNotifications: (
    onChange: (payload: { unreadCount: number }) => void,
    options?: NotificationLongPollOptions
  ): (() => void) => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastCount: number | null = null;
    let delayMs = options?.intervalMs ?? REALTIME_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MS;

    const schedule = (ms: number) => {
      if (!active) return;
      timer = setTimeout(run, ms);
    };

    const run = async () => {
      if (!active) return;
      try {
        const unread = await notificationService.getUnreadCount();
        if (lastCount == null || unread.count !== lastCount) {
          lastCount = unread.count;
          onChange({ unreadCount: unread.count });
        }
        delayMs = options?.intervalMs ?? REALTIME_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MS;
      } catch {
        delayMs = Math.max(delayMs, REALTIME_CONFIG.ERROR_RETRY_INTERVAL_MS);
      } finally {
        schedule(delayMs);
      }
    };

    run();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  },
};
