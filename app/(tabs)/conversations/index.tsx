import { UgcCommunityTermsGate } from "@/components/ugc-community-terms-gate";
import { ConversationListSkeleton } from "@/components/ui/conversation-list-skeleton";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { REALTIME_CONFIG } from "@/constants/realtime";
import { getUgcCommunityTermsStorageKey } from "@/constants/ugc-terms";
import {
  Conversation,
  messageService,
} from "@/services/message-service";
import { notificationService } from "@/services/notification-service";
import { realtimeSyncService } from "@/services/realtime-sync-service";
import { useAuthStore } from "@/store/auth-store";
import { storage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const MIN_CONVERSATIONS_SKELETON_MS = 720;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationsTabScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const isRTL = i18n.language === "ar";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
  const [ugcAccepted, setUgcAccepted] = useState(false);
  const [ugcReady, setUgcReady] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setUgcAccepted(true);
      setUgcReady(true);
      return;
    }
    setUgcReady(false);
    const key = getUgcCommunityTermsStorageKey(user.id);
    storage.getItem(key).then((v) => {
      setUgcAccepted(v === "true");
      setUgcReady(true);
    });
  }, [user?.id, authLoading]);

  const fetchConversations = useCallback(async (isRefresh = false) => {
    const startedAt = Date.now();
    try {
      if (!isRefresh) setIsLoading(true);
      const ugcKey = user?.id ? getUgcCommunityTermsStorageKey(user.id) : "";
      if (!ugcKey || (await storage.getItem(ugcKey)) !== "true") {
        setConversations([]);
        const elapsed = Date.now() - startedAt;
        const minMs = isRefresh ? 0 : MIN_CONVERSATIONS_SKELETON_MS;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, minMs - elapsed))
        );
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      const res = await messageService.getConversations();
      setConversations(res.conversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: error.message || t("failed_to_load_messages", { defaultValue: "Failed to load messages" }),
      });
    } finally {
      const minMs = isRefresh ? 0 : MIN_CONVERSATIONS_SKELETON_MS;
      const elapsed = Date.now() - startedAt;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, minMs - elapsed))
      );
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.id]);

  const acceptUgcTerms = async () => {
    if (!user?.id) return;
    await storage.setItem(getUgcCommunityTermsStorageKey(user.id), "true");
    setUgcAccepted(true);
    await fetchConversations(true);
  };

  useEffect(() => {
    if (!ugcReady || authLoading) return;
    void fetchConversations();
  }, [ugcReady, fetchConversations, authLoading]);

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadNotifications(res.count);
    } catch {
      // Ignore transient polling failures; existing badge value stays visible.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!ugcReady || authLoading) return;
      void fetchConversations();
    }, [fetchConversations, ugcReady, authLoading])
  );

  useFocusEffect(
    useCallback(() => {
      if (!ugcReady || authLoading) return;

      void refreshUnreadNotifications();

      const stopMessagesPolling = setInterval(() => {
        void fetchConversations(true);
      }, REALTIME_CONFIG.CONVERSATIONS_POLL_INTERVAL_MS);

      const stopNotificationsPolling = notificationService.watchNotifications(
        ({ unreadCount }) => setUnreadNotifications(unreadCount),
        { intervalMs: REALTIME_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MS }
      );

      const unsubscribeChat = realtimeSyncService.subscribe("chat_updated", () => {
        void fetchConversations(true);
      });
      const unsubscribeNotifications = realtimeSyncService.subscribe("notifications_updated", () => {
        void refreshUnreadNotifications();
      });

      return () => {
        clearInterval(stopMessagesPolling);
        stopNotificationsPolling();
        unsubscribeChat();
        unsubscribeNotifications();
      };
    }, [authLoading, fetchConversations, refreshUnreadNotifications, ugcReady])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const msg = item.latest_message;
    const other = item.other_participant;
    if (!other) return null;
    const project = item.project;
    const rawAvatar = other.avatar || other.profile_photo_url;
    const avatar =
      typeof rawAvatar === "string" && rawAvatar.trim().length > 0
        ? rawAvatar.trim()
        : null;

    const avatarUri =
      avatar && avatar.includes("ui-avatars.com/api")
        ? `${avatar}${avatar.includes("?") ? "&" : "?"}format=png`
        : avatar;

    const fallbackLetter = (other.name || other.email || "?")[0].toUpperCase();
    const key = `${other.id}_${item.project?.id ?? "no_project"}`;
    const avatarFailed = !!failedAvatars[key];

    const goToChat = () => {
      if (!other?.id || !project?.id) return;
      router.push({
        pathname: "/chat",
        params: {
          otherUserId: String(other.id),
          otherUserName: other.name || other.email || "User",
          projectId: String(project.id),
          projectTitle: project.title || "",
          youBlockedThem: item.you_blocked_them ? "1" : "0",
        },
      });
    };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={goToChat}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {avatarUri && !avatarFailed ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setFailedAvatars((prev) => ({ ...prev, [key]: true }))}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {fallbackLetter}
              </Text>
            </View>
          )}
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.content,
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <Text
            style={[styles.name, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold }]}
            numberOfLines={1}
          >
            {other.name || other.email}
          </Text>
          <Text
            style={[styles.projectTitle, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}
            numberOfLines={1}
          >
            {item.project?.title || t("project", { defaultValue: "Project" })}
          </Text>
          <Text
            style={[styles.preview, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold }]}
            numberOfLines={2}
          >
            {msg?.message || ""}
          </Text>
        </View>
        <Text style={[styles.time, isRTL ? { marginRight: "auto" } : { marginLeft: "auto", fontFamily: Fonts.CairoRegular }]}>
          {msg?.created_at ? formatTime(msg.created_at) : ""}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientOverlay />
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>
          {t("messages", { defaultValue: "Messages", fontFamily: Fonts.CairoSemiBold })}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={styles.notificationButton}
          hitSlop={12}
        >
          <Ionicons name="notifications-outline" size={24} color="#002347" />
          {unreadNotifications > 0 ? (
            <View style={styles.headerUnreadBadge}>
              <Text style={styles.headerUnreadText}>
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ConversationListSkeleton isRTL={isRTL} />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) =>
            `${item.other_participant?.id}_${item.project?.id}`
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            ugcReady && !ugcAccepted ? (
              <View style={{ minHeight: 280 }} />
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={Colors.placeholder}
                />
                <Text style={styles.emptyText}>
                  {t("no_messages_yet", {
                    defaultValue: "No messages yet. Contact a project owner from a project details page.",
                  })}
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      <UgcCommunityTermsGate visible={ugcReady && !ugcAccepted} onAccept={acceptUgcTerms} />
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center" as const,
    zIndex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerUnreadBadge: {
    position: "absolute" as const,
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E11D48",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 4,
  },
  headerUnreadText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: Fonts.CairoBold,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#002347",
    textAlign: "center" as const,
    fontFamily: Fonts.CairoSemiBold,
  },
  loading: { flex: 1, justifyContent: "center" as const, alignItems: "center" as const },
  listContent: { paddingBottom: 24 },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    alignItems: "center" as const,
  },
  avatarContainer: { position: "relative" as const },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "600" as const, fontFamily: Fonts.CairoSemiBold },
  unreadBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 4,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "600" as const, fontFamily: Fonts.CairoSemiBold },
  content: { flex: 1, marginHorizontal: 12 },
  name: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#002347",
    fontFamily: Fonts.CairoSemiBold,
  },
  projectTitle: {
    fontSize: 12,
    color: "#666",
    fontFamily: Fonts.CairoRegular,
    // marginTop: 2,
  },
  preview: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  empty: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center" as const,
    marginTop: 16,
    fontFamily: Fonts.CairoSemiBold,
  },
};
