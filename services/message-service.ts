import { API_CONFIG } from "../constants/api";
import { REALTIME_CONFIG } from "../constants/realtime";
import apiClient from "../utils/api";

export interface MessageUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  profile_photo_url?: string;
}

export interface MessageProject {
  id: number;
  title: string;
}

export interface MessageAttachment {
  path: string;
  url: string;
  filename: string;
  original_name?: string;
  mime_type: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  project_id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  attachments?: MessageAttachment[];
  sender?: MessageUser;
  receiver?: MessageUser;
  project?: MessageProject;
}

export interface Conversation {
  other_participant: MessageUser;
  project: MessageProject;
  latest_message: Message;
  unread_count: number;
  total_messages: number;
  you_blocked_them?: boolean;
}

export interface AttachmentInput {
  content: string; // base64
  mime_type: string;
  filename?: string;
}

export interface SendMessageParams {
  receiver_id: number;
  project_id: number;
  subject?: string;
  message: string;
  interest_id?: number;
  attachments?: AttachmentInput[];
}

export interface ConversationLongPollOptions {
  intervalMs?: number;
  perPage?: number;
}

export const messageService = {
  getConversations: async (): Promise<{
    conversations: Conversation[];
    unread_count: number;
  }> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES);
    const data = response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return {
      conversations: list,
      unread_count: response.data?.unread_count ?? 0,
    };
  },

  getConversation: async (
    otherUserId: number,
    projectId: number,
    page = 1,
    perPage = 30,
    sinceMessageId?: number,
    waitSeconds?: number
  ): Promise<{
    messages: Message[];
    meta?: { last_page: number };
    userHasReportedChat?: boolean;
    you_blocked_them?: boolean;
    hasNewMessages?: boolean;
    latestMessageId?: number;
  }> => {
    const params: Record<string, number> = {
      other_user_id: otherUserId,
      project_id: projectId,
      per_page: perPage,
      page,
    };
    if (typeof sinceMessageId === "number" && sinceMessageId > 0) {
      params.since_message_id = sinceMessageId;
    }
    if (typeof waitSeconds === "number" && waitSeconds > 0) {
      params.wait_seconds = waitSeconds;
    }

    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.MESSAGES}/conversation`,
      { params }
    );
    const data = response.data?.data ?? response.data;
    const messages = Array.isArray(data) ? data : [];
    return {
      messages,
      meta: response.data?.meta,
      userHasReportedChat: response.data?.user_has_reported_chat ?? false,
      you_blocked_them: response.data?.you_blocked_them === true,
      hasNewMessages: response.data?.has_new_messages === true,
      latestMessageId:
        typeof response.data?.latest_message_id === "number"
          ? response.data.latest_message_id
          : undefined,
    };
  },

  sendMessage: async (params: SendMessageParams): Promise<Message> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES, {
      receiver_id: params.receiver_id,
      project_id: params.project_id,
      subject: params.subject,
      message: params.message,
      interest_id: params.interest_id,
      attachments: params.attachments,
    });
    return response.data?.data ?? response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.MESSAGES}/unread-count`
    );
    return response.data?.unread_count ?? 0;
  },

  watchConversation: (
    otherUserId: number,
    projectId: number,
    onData: (payload: {
      messages: Message[];
      meta?: { last_page: number };
      userHasReportedChat?: boolean;
      you_blocked_them?: boolean;
    }) => void,
    options?: ConversationLongPollOptions
  ): (() => void) => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let latestMessageId: number | null = null;
    let delayMs = options?.intervalMs ?? REALTIME_CONFIG.CHAT_POLL_INTERVAL_MS;
    const perPage = options?.perPage ?? 30;
    const waitSeconds = Math.max(5, Math.floor(delayMs / 1000));

    const schedule = (ms: number) => {
      if (!active) return;
      timer = setTimeout(run, ms);
    };

    const run = async () => {
      if (!active) return;
      try {
        const payload = await messageService.getConversation(
          otherUserId,
          projectId,
          1,
          perPage,
          latestMessageId ?? undefined,
          waitSeconds
        );
        const headId = payload.latestMessageId ?? payload.messages?.[0]?.id ?? null;
        if (latestMessageId == null || headId !== latestMessageId) {
          latestMessageId = headId;
          onData(payload);
        }
        // Long-poll already waits server-side, so reconnect immediately.
        delayMs = 0;
      } catch {
        delayMs = Math.max(delayMs, REALTIME_CONFIG.ERROR_RETRY_INTERVAL_MS);
      } finally {
        schedule(delayMs);
      }
    };

    // Start immediately and keep polling recursively to avoid overlapping requests.
    run();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  },
};
