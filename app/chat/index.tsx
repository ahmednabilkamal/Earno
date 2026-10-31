import { UgcCommunityTermsGate } from "@/components/ugc-community-terms-gate";
import { ChatThreadSkeleton } from "@/components/ui/chat-thread-skeleton";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { API_CONFIG } from "@/constants/api";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { REALTIME_CONFIG } from "@/constants/realtime";
import { getUgcCommunityTermsStorageKey } from "@/constants/ugc-terms";
import {
    AttachmentInput,
    Message,
    MessageAttachment,
    messageService,
} from "@/services/message-service";
import { realtimeSyncService } from "@/services/realtime-sync-service";
import { CHAT_REPORT_REASONS, ChatReportReason, reportService } from "@/services/report-service";
import { userBlockService } from "@/services/user-block-service";
import { useAuthStore } from "@/store/auth-store";
import { storage } from "@/utils/storage";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Keyboard,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    KeyboardAvoidingView,
} from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const APP_URL = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");

/** Minimum time to show loading UI so skeleton/spinner does not flash */
const MIN_CHAT_LOADING_MS = 720;

function getAttachmentFullUrl(att: MessageAttachment): string {
  const u = att.url || "";
  if (u.startsWith("http")) return u;
  return `${APP_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function firstParamValue(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    otherUserId: string;
    otherUserName: string;
    projectId: string;
    projectTitle: string;
    youBlockedThem?: string;
  }>();
  const { user, isLoading: authLoading } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<(AttachmentInput & { uri?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam_fraud");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [chatHasReported, setChatHasReported] = useState(false);
  const [youBlockedThem, setYouBlockedThem] = useState(() => params.youBlockedThem === "1");
  const [menuSheetVisible, setMenuSheetVisible] = useState(false);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [unblockConfirmVisible, setUnblockConfirmVisible] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);
  const [ugcAccepted, setUgcAccepted] = useState(false);
  const [ugcReady, setUgcReady] = useState(false);

  const otherUserId = Number(firstParamValue(params.otherUserId) || 0);
  const projectId = Number(firstParamValue(params.projectId) || 0);
  const otherUserName = firstParamValue(params.otherUserName) || "User";
  const projectTitle = firstParamValue(params.projectTitle) || "";
  const canOpenProject = projectId > 0;

  const isRTL = i18n.language.startsWith("ar");

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

  useEffect(() => {
    if (ugcReady && !ugcAccepted) {
      setIsLoading(false);
    }
  }, [ugcReady, ugcAccepted]);

  const loadMessages = useCallback(
    async (append = false, silent = false) => {
      if (!otherUserId || !projectId) return;
      const shouldShowBlockingLoader = !append && !silent;
      const loadStartedAt = shouldShowBlockingLoader ? Date.now() : 0;
      try {
        if (shouldShowBlockingLoader) setIsLoading(true);
        const p = append ? page : 1;
        const res = await messageService.getConversation(
          otherUserId,
          projectId,
          p,
          30
        );
        const list = res.messages || [];
        if (append) {
          setMessages((prev) => [...prev, ...list]);
        } else {
          setMessages(list);
        }
        if (!append && res.userHasReportedChat != null) {
          setChatHasReported(res.userHasReportedChat);
        }
        if (!append) {
          setYouBlockedThem(!!res.you_blocked_them);
        }
        const lastPage = res.meta?.last_page ?? 1;
        setHasMore(p < lastPage);
        if (append) setPage((prev) => prev + 1);
        else setPage(1);
      } catch (error: any) {
        console.error("Error loading messages:", error);
        if (error.response?.status === 403 && error.response?.data?.error === "USER_BLOCKED") {
          Toast.show({
            type: "error",
            text1: t("error", { defaultValue: "Error" }),
            text2: t("cannot_access_conversation", {
              defaultValue: "You cannot access this conversation.",
            }),
          });
          router.back();
          return;
        }
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message || "Failed to load messages",
        });
      } finally {
        if (shouldShowBlockingLoader && loadStartedAt > 0) {
          const elapsed = Date.now() - loadStartedAt;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, MIN_CHAT_LOADING_MS - elapsed))
          );
        }
        if (shouldShowBlockingLoader) {
          setIsLoading(false);
        }
      }
    },
    [otherUserId, projectId, page, router, t]
  );

  useFocusEffect(
    useCallback(() => {
      if (!ugcReady || !ugcAccepted) return;
      loadMessages();
    }, [loadMessages, ugcReady, ugcAccepted])
  );

  useEffect(() => {
    if (!ugcReady || !ugcAccepted || !otherUserId || !projectId) return;

    const stopPolling = messageService.watchConversation(
      otherUserId,
      projectId,
      (payload) => {
        setMessages(payload.messages || []);
        setChatHasReported(Boolean(payload.userHasReportedChat));
        setYouBlockedThem(payload.you_blocked_them === true);
        const lastPage = payload.meta?.last_page ?? 1;
        setHasMore(1 < lastPage);
        setPage(1);
      },
      { intervalMs: REALTIME_CONFIG.CHAT_POLL_INTERVAL_MS, perPage: 30 }
    );

    const unsubscribe = realtimeSyncService.subscribe("chat_updated", () => {
      // Keep realtime updates smooth without flashing the full-page skeleton.
      loadMessages(false, true);
    });

    return () => {
      stopPolling();
      unsubscribe();
    };
  }, [loadMessages, otherUserId, projectId, ugcAccepted, ugcReady]);

  const acceptUgcTerms = async () => {
    if (!user?.id) return;
    await storage.setItem(getUgcCommunityTermsStorageKey(user.id), "true");
    setUgcAccepted(true);
    loadMessages();
  };

  const showAttachOptions = () => setAttachSheetVisible(true);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("error"), t("gallery_permission_attach_hint"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("open_settings"), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const items: (AttachmentInput & { uri?: string })[] = [];
    for (const asset of result.assets) {
      const uri = asset.uri;
      const mime = asset.type === "video" ? "video/mp4" : "image/jpeg";
      const filename = asset.fileName || (asset.type === "video" ? "video.mp4" : "image.jpg");
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      items.push({ content: base64, mime_type: mime, filename, uri });
    }
    if (items.length + pendingAttachments.length > 4) {
      Toast.show({ type: "error", text1: "Limit", text2: "Max 4 attachments per message" });
      return;
    }
    setPendingAttachments((p) => [...p, ...items]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/*",
        "video/*",
      ],
      copyToCacheDirectory: true,
      multiple: true,
    });
    const assets = result.canceled ? [] : result.assets ?? [];
    const items: (AttachmentInput & { uri?: string })[] = [];
    for (const asset of assets) {
      if (!asset?.uri) continue;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const mime = (asset as { mimeType?: string }).mimeType || "application/octet-stream";
      const filename = asset.name || "document";
      items.push({ content: base64, mime_type: mime, filename, uri: asset.uri });
    }
    if (items.length + pendingAttachments.length > 4) {
      Toast.show({ type: "error", text1: "Limit", text2: "Max 4 attachments per message" });
      return;
    }
    setPendingAttachments((p) => [...p, ...items]);
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((p) => p.filter((_, i) => i !== index));
  };

  const confirmBlockUser = async () => {
    setBlockSubmitting(true);
    try {
      await userBlockService.blockUser(otherUserId);
      setYouBlockedThem(true);
      setBlockConfirmVisible(false);
      setMenuSheetVisible(false);
      Toast.show({
        type: "success",
        text1: t("user_blocked_success", { defaultValue: "User blocked" }),
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error", { defaultValue: "Error" }),
        text2:
          error.response?.data?.message ||
          error.message ||
          t("could_not_block", { defaultValue: "Could not block user" }),
      });
    } finally {
      setBlockSubmitting(false);
    }
  };

  const confirmUnblockUser = async () => {
    setUnblockSubmitting(true);
    try {
      await userBlockService.unblockUser(otherUserId);
      setYouBlockedThem(false);
      setUnblockConfirmVisible(false);
      setMenuSheetVisible(false);
      Toast.show({
        type: "success",
        text1: t("user_unblocked_success", { defaultValue: "User unblocked" }),
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error", { defaultValue: "Error" }),
        text2:
          error.response?.data?.message ||
          error.message ||
          t("could_not_unblock", { defaultValue: "Could not unblock user" }),
      });
    } finally {
      setUnblockSubmitting(false);
    }
  };

  const composerLocked = youBlockedThem || sending;

  const submitReport = async () => {
    if (reportReason === "other" && !reportDescription.trim()) {
      Toast.show({ type: "error", text1: t("description_required", { defaultValue: "Description required" }), text2: t("provide_details_other", { defaultValue: "Please provide details for Other reason" }) });
      return;
    }
    setReportSubmitting(true);
    try {
      await reportService.createReport({
        report_type: "chat",
        reason: reportReason,
        description: reportDescription.trim() || undefined,
        reported_user_id: otherUserId,
        reported_project_id: projectId,
      });
      Toast.show({ type: "success", text1: t("report_submitted", { defaultValue: "Report submitted" }), text2: t("report_thank_you", { defaultValue: "Thank you. We will review your report." }) });
      setReportModalVisible(false);
      setReportDescription("");
      setReportReason("spam_fraud");
      setChatHasReported(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error", { defaultValue: "Error" }),
        text2: error.response?.data?.message || error.message || t("failed_submit_report", { defaultValue: "Failed to submit report" }),
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (youBlockedThem) return;
    const text = inputText.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if ((!text && !hasAttachments) || sending) return;
    setSending(true);
    const msg = text || ".";
    setInputText("");
    const toSend = [...pendingAttachments];
    setPendingAttachments([]);
    try {
      const sent = await messageService.sendMessage({
        receiver_id: otherUserId,
        project_id: projectId,
        message: msg,
        attachments: toSend.length
          ? toSend.map(({ content, mime_type, filename }) => ({ content, mime_type, filename }))
          : undefined,
      });
      setMessages((prev) => [sent, ...prev]);
      realtimeSyncService.emit("chat_updated");
      setTimeout(
        () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }),
        100
      );
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error === "USER_BLOCKED") {
        Toast.show({
          type: "error",
          text1: t("error", { defaultValue: "Error" }),
          text2: t("cannot_message_blocked_user", {
            defaultValue: "You cannot exchange messages with this user.",
          }),
        });
        router.back();
        return;
      }
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.errors)
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        error.message ||
        "Failed to send message";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errMsg,
      });
      setInputText(text);
      setPendingAttachments(toSend);
    } finally {
      setSending(false);
    }
  };

  const isImageMime = (m: string) => /^image\//.test(m);
  const isVideoMime = (m: string) => /^video\//.test(m);

  const [viewerAttachment, setViewerAttachment] = useState<{
    url: string;
    mimeType: string;
  } | null>(null);
  const viewerVideoSource = viewerAttachment && isVideoMime(viewerAttachment.mimeType)
    ? { uri: viewerAttachment.url }
    : null;
  const viewerVideoPlayer = useVideoPlayer(viewerVideoSource, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    if (viewerVideoSource) {
      viewerVideoPlayer.play();
      return;
    }

    viewerVideoPlayer.pause();
  }, [viewerVideoPlayer, viewerVideoSource]);

  const openAttachment = async (att: MessageAttachment) => {
    const url = getAttachmentFullUrl(att);
    if (isImageMime(att.mime_type) || isVideoMime(att.mime_type)) {
      setViewerAttachment({ url, mimeType: att.mime_type });
    } else {
      try {
        await WebBrowser.openBrowserAsync(url, { presentationStyle: "pageSheet" });
      } catch (e) {
        Toast.show({ type: "error", text1: "Unable to open", text2: "Could not open this file" });
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === (user?.id ? Number(user.id) : -1);
    const attachments = item.attachments ?? [];
    return (
      <View
        style={[
          styles.messageRow,
          { flexDirection: "row" },
          isMe ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.theirBubble,
            { alignSelf: isMe ? "flex-end" : "flex-start" },
          ]}
        >
          {attachments.length > 0 && (
            <View style={styles.attachmentsWrap}>
              {(() => {
                const media = attachments.filter((a) => isImageMime(a.mime_type) || isVideoMime(a.mime_type));
                const docs = attachments.filter((a) => !isImageMime(a.mime_type) && !isVideoMime(a.mime_type));
                const isGrid = media.length > 1;
                return (
                  <>
                    {media.length > 0 && (
                      <View style={[styles.mediaGrid, isGrid && styles.mediaGridMulti]}>
                        {media.map((att, i) => {
                          const fullUrl = getAttachmentFullUrl(att);
                          if (isImageMime(att.mime_type)) {
                            return (
                              <TouchableOpacity
                                key={i}
                                onPress={() => openAttachment(att)}
                                style={[styles.attachmentImageWrap, isGrid && styles.attachmentGridItem]}
                                activeOpacity={0.8}
                              >
                                <Image
                                  source={{ uri: fullUrl }}
                                  style={[styles.attachmentImage, isGrid && styles.attachmentGridImage]}
                                  contentFit="cover"
                                  transition={200}
                                />
                              </TouchableOpacity>
                            );
                          }
                          return (
                            <TouchableOpacity

                              key={i}
                              onPress={() => openAttachment(att)}
                              style={[styles.attachmentVideoWrap, isGrid && styles.attachmentGridItem]}
                              activeOpacity={0.7}
                            >
                              <VideoThumbnail
                                uri={fullUrl}
                                style={StyleSheet.absoluteFillObject}
                                playIconSize={isGrid ? 28 : 48}
                              />
                              <View style={styles.playIconOverlay}>
                                <Ionicons
                                  name="play-circle"
                                  size={isGrid ? 28 : 48}
                                  color="rgba(255,255,255,0.9)"
                                />
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {docs.map((att, i) => (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        key={`doc-${i}`}
                        style={[styles.attachmentDoc, isMe ? styles.attachmentDocMe : styles.attachmentDocThem]}
                        onPress={() => openAttachment(att)}
                      >
                        <Ionicons name="document-attach" size={20} color={isMe ? "#fff" : "#666"} />
                        <Text
                          style={[styles.attachmentDocText, isMe ? styles.myText : styles.theirText]}
                          numberOfLines={2}
                        >
                          {att.original_name || att.filename}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              })()}
            </View>
          )}
          {item.message && item.message !== "." && (
            <Text
              style={[styles.messageText, isMe ? styles.myText : styles.theirText]}
            >
              {item.message}
            </Text>
          )}
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.myTime : styles.theirTime,
            ]}
          >
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (!otherUserId || !projectId) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientOverlay />
        <View style={styles.center}>
          <Text style={styles.errorText}>Invalid chat. Go back.</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!ugcReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GradientOverlay />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientOverlay />
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={22}
            color="#002347"
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canOpenProject}
          hitSlop={12}
          onPress={() => {
            if (!canOpenProject) return;
            router.push({
              pathname: "/project-details",
              params: { id: String(projectId) },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={t("open_project_details", {
            defaultValue: "Open project details",
          })}
          style={styles.headerCenterButton}
        >
          <View style={[styles.headerCenter, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUserName}
          </Text>
          <View style={styles.headerProjectButton}>
            <Text style={styles.headerProject} numberOfLines={1}>
              {projectTitle}
            </Text>
          </View>
        </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMenuSheetVisible(true)}
          style={styles.reportButton}
          hitSlop={12}
          accessibilityLabel={t("chat_menu_a11y", { defaultValue: "Chat options" })}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#002347" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ChatThreadSkeleton />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => String(item.id)}
            inverted
            style={{ direction: "ltr" }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('no_chats_yet')}</Text>
              </View>
            }
          />
        )}

        {youBlockedThem && (
          <View
            style={[
              styles.blockedBanner,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={styles.blockedBannerIcon}>
              <Ionicons name="hand-left-outline" size={22} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.blockedBannerTitle,
                  { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                ]}
              >
                {t("you_blocked_this_user", { defaultValue: "You blocked this user" })}
              </Text>
              <Text
                style={[
                  styles.blockedBannerHint,
                  { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                ]}
              >
                {t("you_blocked_chat_hint", {
                  defaultValue: "Open the menu and choose Unblock to send messages again.",
                })}
              </Text>
            </View>
          </View>
        )}
        {pendingAttachments.length > 0 && (
          <View style={styles.pendingRow}>
            {pendingAttachments.map((a, i) => {
              const isImg = /^image\//.test(a.mime_type);
              const isVid = /^video\//.test(a.mime_type);
              const previewUri = a.uri || (isImg ? `data:${a.mime_type};base64,${a.content}` : null);
              return (
                <View key={i} style={styles.pendingItem}>
                  {isImg && previewUri ? (
                    <View style={styles.pendingThumb}>
                      <Image
                        source={{ uri: previewUri }}
                        style={styles.pendingThumbImage}
                        contentFit="cover"
                      />
                    </View>
                  ) : isVid && a.uri ? (
                    <View style={styles.pendingThumb}>
                      <VideoThumbnail uri={a.uri} style={styles.pendingThumbImage} playIconSize={32} />
                      <View style={styles.pendingThumbPlay}>
                        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
                      </View>
                    </View>
                  ) : isVid ? (
                    <View style={[styles.pendingThumb, styles.pendingThumbVideo]}>
                      <View style={styles.pendingThumbPlay}>
                        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pendingChip}>
                      <Ionicons name="document" size={24} color="#666" />
                      <Text style={styles.pendingChipText} numberOfLines={1}>
                        {a.filename || "File"}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={8}
                    onPress={() => removePendingAttachment(i)}
                    style={styles.pendingRemove}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View
          style={[
            styles.inputRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
            youBlockedThem && styles.inputRowDisabled,
          ]}
          pointerEvents={youBlockedThem ? "none" : "auto"}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={showAttachOptions}
            style={styles.attachButton}
            disabled={composerLocked}
          >
            <Ionicons name="attach" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              {
                textAlign: isRTL ? "right" : "left",
                fontFamily: Fonts.AlmaraiRegular
              },
            ]}
            placeholder={t('type_message')}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            editable={!composerLocked}
            {...withoutCredentialAutofill()}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.sendButton,
              ((!inputText.trim() && !pendingAttachments.length) || composerLocked) && styles.sendDisabled,
            ]}
            onPress={sendMessage}
            disabled={(!inputText.trim() && !pendingAttachments.length) || composerLocked}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" style={{ transform: isRTL ? [{ scaleX: -1 }] : [] }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={menuSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuSheetVisible(false)}
      >
        <Pressable
          style={menuSheetStyles.overlay}
          onPress={() => setMenuSheetVisible(false)}
        >
          <Pressable style={menuSheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={menuSheetStyles.grabber} />
            <Text
              style={[
                menuSheetStyles.sheetTitle,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold },
              ]}
            >
              {t("chat_menu_title", { defaultValue: "Chat options" })}
            </Text>
            {!chatHasReported && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[menuSheetStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => {
                  setMenuSheetVisible(false);
                  setReportModalVisible(true);
                }}
              >
                <View style={[menuSheetStyles.rowIcon, menuSheetStyles.rowIconMuted]}>
                  <Ionicons name="flag-outline" size={22} color="#374151" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      menuSheetStyles.rowTitle,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                    ]}
                  >
                    {t("report_conversation", { defaultValue: "Report conversation" })}
                  </Text>
                  <Text
                    style={[
                      menuSheetStyles.rowSubtitle,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                    ]}
                  >
                    {t("safety_and_policy", { defaultValue: "Safety and policy" })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {!youBlockedThem ? (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[menuSheetStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => {
                  setMenuSheetVisible(false);
                  setBlockConfirmVisible(true);
                }}
              >
                <View style={[menuSheetStyles.rowIcon, menuSheetStyles.rowIconDanger]}>
                  <Ionicons name="person-remove-outline" size={22} color="#B91C1C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      menuSheetStyles.rowTitleDanger,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                    ]}
                  >
                    {t("block_user", { defaultValue: "Block user" })}
                  </Text>
                  <Text
                    style={[
                      menuSheetStyles.rowSubtitleDanger,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                    ]}
                  >
                    {t("block_user_menu_hint", {
                      defaultValue: "No messages or project access",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[menuSheetStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => {
                  setMenuSheetVisible(false);
                  setUnblockConfirmVisible(true);
                }}
              >
                <View style={[menuSheetStyles.rowIcon, menuSheetStyles.rowIconTeal]}>
                  <Ionicons name="lock-open-outline" size={22} color="#0F766E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      menuSheetStyles.rowTitleTeal,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                    ]}
                  >
                    {t("unblock_user", { defaultValue: "Unblock user" })}
                  </Text>
                  <Text
                    style={[
                      menuSheetStyles.rowSubtitleTeal,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                    ]}
                  >
                    {t("unblock_user_menu_hint", {
                      defaultValue: "Allow messages and discovery again",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.8}
              style={menuSheetStyles.dismissBtn}
              onPress={() => setMenuSheetVisible(false)}
            >
              <Text style={[menuSheetStyles.dismissText, { fontFamily: Fonts.CairoSemiBold }]}>
                {t("close", { defaultValue: "Close" })}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={blockConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !blockSubmitting && setBlockConfirmVisible(false)}
      >
        <Pressable
          style={blockConfirmStyles.backdrop}
          onPress={() => !blockSubmitting && setBlockConfirmVisible(false)}
        >
          <Pressable style={blockConfirmStyles.card} onPress={(e) => e.stopPropagation()}>
            <View style={blockConfirmStyles.iconWrap}>
              <Ionicons name="person-remove" size={36} color="#DC2626" />
            </View>
            <Text
              style={[
                blockConfirmStyles.title,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold },
              ]}
            >
              {t("block_user_confirm_title", { defaultValue: "Block this user?" })}
            </Text>
            <Text
              style={[
                blockConfirmStyles.lead,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
              ]}
            >
              {t("block_user_effects_intro", {
                defaultValue:
                  "They will not be notified. You can unblock them anytime from this chat.",
              })}
            </Text>
            <View style={blockConfirmStyles.bullets}>
              {[
                t("block_effect_no_messages", {
                  defaultValue: "Neither of you can send messages in this chat",
                }),
                t("block_effect_projects_hidden", {
                  defaultValue: "Your projects will be hidden from them (and theirs from you)",
                }),
                t("block_effect_no_contact", {
                  defaultValue: "WhatsApp and phone won’t appear on project pages between you",
                }),
              ].map((line, bi) => (
                <View
                  key={`b-${bi}`}
                  style={[blockConfirmStyles.bulletRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
                  <Text
                    style={[
                      blockConfirmStyles.bulletText,
                      { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                    ]}
                  >
                    {line}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[blockConfirmStyles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={blockConfirmStyles.cancelBtn}
                onPress={() => !blockSubmitting && setBlockConfirmVisible(false)}
                disabled={blockSubmitting}
              >
                <Text style={[blockConfirmStyles.cancelText, { fontFamily: Fonts.CairoSemiBold }]}>
                  {t("cancel", { defaultValue: "Cancel" })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[blockConfirmStyles.dangerBtn, blockSubmitting && blockConfirmStyles.btnDisabled]}
                onPress={() => void confirmBlockUser()}
                disabled={blockSubmitting}
              >
                {blockSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[blockConfirmStyles.dangerText, { fontFamily: Fonts.CairoSemiBold }]}>
                    {t("block_user", { defaultValue: "Block user" })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={unblockConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !unblockSubmitting && setUnblockConfirmVisible(false)}
      >
        <Pressable
          style={blockConfirmStyles.backdrop}
          onPress={() => !unblockSubmitting && setUnblockConfirmVisible(false)}
        >
          <Pressable style={blockConfirmStyles.card} onPress={(e) => e.stopPropagation()}>
            <View style={[blockConfirmStyles.iconWrap, { backgroundColor: "#CCFBF1" }]}>
              <Ionicons name="lock-open" size={32} color="#0F766E" />
            </View>
            <Text
              style={[
                blockConfirmStyles.title,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold },
              ]}
            >
              {t("unblock_user_confirm_title", { defaultValue: "Unblock this user?" })}
            </Text>
            <Text
              style={[
                blockConfirmStyles.lead,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
              ]}
            >
              {t("unblock_user_confirm_message", {
                defaultValue:
                  "You will be able to message each other and see each other's projects again, according to normal visibility rules.",
              })}
            </Text>
            <View style={[blockConfirmStyles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={blockConfirmStyles.cancelBtn}
                onPress={() => !unblockSubmitting && setUnblockConfirmVisible(false)}
                disabled={unblockSubmitting}
              >
                <Text style={[blockConfirmStyles.cancelText, { fontFamily: Fonts.CairoSemiBold }]}>
                  {t("cancel", { defaultValue: "Cancel" })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[blockConfirmStyles.tealBtn, unblockSubmitting && blockConfirmStyles.btnDisabled]}
                onPress={() => void confirmUnblockUser()}
                disabled={unblockSubmitting}
              >
                {unblockSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[blockConfirmStyles.tealText, { fontFamily: Fonts.CairoSemiBold }]}>
                    {t("unblock_user", { defaultValue: "Unblock user" })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { Keyboard.dismiss(); setReportModalVisible(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={reportModalStyles.backdrop}
        >
          <Pressable
            style={[
              reportModalStyles.backdropPressArea,
              {
                paddingTop: insets.top + 16,
                paddingBottom: Math.max(insets.bottom, 16) + 16,
                paddingHorizontal: 16,
              },
            ]}
            onPress={() => {
              if (Keyboard.isVisible()) {
                Keyboard.dismiss();
                return;
              }

              setReportModalVisible(false);
            }}
          >
            <Pressable
              style={[
                reportModalStyles.box,
                {
                  width: "100%",
                  maxHeight: "100%",
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                Keyboard.dismiss();
              }}
            >
              <ScrollView
                style={reportModalStyles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                bounces={false}
                contentContainerStyle={reportModalStyles.scrollContent}
              >
            <Text style={[reportModalStyles.title, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold }]}>
              {t("report_conversation", { defaultValue: "Report Conversation" })}
            </Text>
            <Text style={[reportModalStyles.subtitle, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}>
              {t("report_conversation_hint", { defaultValue: "Report this conversation for inappropriate behavior or content." })}
            </Text>
            <Text style={[reportModalStyles.label, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold }]}>
              {t("reason", { defaultValue: "Reason" })}
            </Text>
            <View style={reportModalStyles.reasonList}>
              {CHAT_REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={r.value}
                  style={[reportModalStyles.reasonBtn, reportReason === r.value && reportModalStyles.reasonBtnActive, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setReportReason(r.value as ChatReportReason);
                  }}
                >
                  <View style={[reportModalStyles.radioCircle, reportReason === r.value && reportModalStyles.radioCircleActive]}>
                    {reportReason === r.value && <View style={reportModalStyles.radioInner} />}
                  </View>
                  <Text style={[reportModalStyles.reasonText, reportReason === r.value && reportModalStyles.reasonTextActive,
                  { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}>
                    {t(`report_reason_${r.value}` as const, { defaultValue: isRTL ? r.labelAr : r.labelEn })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[reportModalStyles.label, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold }]}>
              {t("description_optional", { defaultValue: "Description (optional)" })}
            </Text>
            <TextInput
              style={[reportModalStyles.input, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}
              placeholder={t("add_details", { defaultValue: "Add details..." })}
              placeholderTextColor="#999"
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              {...withoutCredentialAutofill()}
            />
              </ScrollView>
              <View style={[reportModalStyles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={reportModalStyles.cancelBtn}
                  onPress={() => { Keyboard.dismiss(); setReportModalVisible(false); }}
                  disabled={reportSubmitting}
                >
                  <Text style={reportModalStyles.cancelText}>{t("cancel", { defaultValue: "Cancel" })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[reportModalStyles.submitBtn, reportSubmitting && reportModalStyles.submitDisabled]}
                  onPress={() => {
                    Keyboard.dismiss();
                    submitReport();
                  }}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={reportModalStyles.submitText}>{t("submit_report", { defaultValue: "Submit Report" })}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={attachSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachSheetVisible(false)}
      >
        <Pressable
          style={menuSheetStyles.overlay}
          onPress={() => setAttachSheetVisible(false)}
        >
          <Pressable style={menuSheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={menuSheetStyles.grabber} />
            <Text
              style={[
                menuSheetStyles.sheetTitle,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold },
              ]}
            >
              {t("attach_sheet_title", { defaultValue: "Add attachment" })}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[menuSheetStyles.row, { flexDirection: isRTL ? "row-reverse" : "row", borderBottomWidth: 0 }]}
              onPress={() => {
                setAttachSheetVisible(false);
                requestAnimationFrame(() => void pickMedia());
              }}
            >
              <View style={[menuSheetStyles.rowIcon, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="images-outline" size={22} color="#0369A1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    menuSheetStyles.rowTitle,
                    { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                  ]}
                >
                  {t("attach_photos_videos", { defaultValue: "Photos & videos" })}
                </Text>
                <Text
                  style={[
                    menuSheetStyles.rowSubtitle,
                    { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                  ]}
                >
                  {t("attach_photos_videos_hint", { defaultValue: "Choose from your gallery" })}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[menuSheetStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => {
                setAttachSheetVisible(false);
                requestAnimationFrame(() => void pickDocument());
              }}
            >
              <View style={[menuSheetStyles.rowIcon, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="document-text-outline" size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    menuSheetStyles.rowTitle,
                    { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold },
                  ]}
                >
                  {t("attach_documents", { defaultValue: "Documents" })}
                </Text>
                <Text
                  style={[
                    menuSheetStyles.rowSubtitle,
                    { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                  ]}
                >
                  {t("attach_documents_hint", { defaultValue: "PDF, Word, PowerPoint, and more" })}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={menuSheetStyles.dismissBtn}
              onPress={() => setAttachSheetVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={menuSheetStyles.dismissText}>
                {t("cancel", { defaultValue: "Cancel" })}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!viewerAttachment}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerAttachment(null)}
      >
        <Pressable
          style={viewerStyles.backdrop}
          onPress={() => setViewerAttachment(null)}
        >
          <Pressable style={viewerStyles.content} onPress={(e) => e.stopPropagation()}>
            {viewerAttachment && (
              <>
                <TouchableOpacity
                  style={viewerStyles.closeBtn}
                  onPress={() => setViewerAttachment(null)}
                  hitSlop={16}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                {isImageMime(viewerAttachment.mimeType) ? (
                  <Image
                    source={{ uri: viewerAttachment.url }}
                    style={viewerStyles.media}
                    contentFit="contain"
                    transition={200}
                  />
                ) : (
                  <VideoView
                    player={viewerVideoPlayer}
                    style={viewerStyles.media}
                    nativeControls
                    contentFit="contain"
                  />
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <UgcCommunityTermsGate visible={ugcReady && !ugcAccepted} onAccept={acceptUgcTerms} />
    </SafeAreaView>
  );
}

const menuSheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    color: "#002347",
    marginBottom: 14,
  },
  row: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconMuted: { backgroundColor: "#F3F4F6" },
  rowIconDanger: { backgroundColor: "#FEE2E2" },
  rowIconTeal: { backgroundColor: "#CCFBF1" },
  rowTitle: { fontSize: 15, color: "#111827" },
  rowSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  rowTitleDanger: { fontSize: 15, color: "#991B1B" },
  rowSubtitleDanger: { fontSize: 12, color: "#B91C1C", marginTop: 2, opacity: 0.85 },
  rowTitleTeal: { fontSize: 15, color: "#115E59" },
  rowSubtitleTeal: { fontSize: 12, color: "#0F766E", marginTop: 2, opacity: 0.9 },
  dismissBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  dismissText: { fontSize: 15, color: "#374151" },
});

const blockConfirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },
  iconWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    color: "#002347",
    marginBottom: 8,
  },
  lead: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  bullets: { gap: 10, marginBottom: 8 },
  bulletRow: { gap: 10, alignItems: "flex-start" },
  bulletText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },
  actions: { gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, color: "#4B5563" },
  dangerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  dangerText: { fontSize: 15, color: "#fff" },
  tealBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#0D9488",
    alignItems: "center",
  },
  tealText: { fontSize: 15, color: "#fff" },
  btnDisabled: { opacity: 0.55 },
});

const reportModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPressArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    overflow: "hidden",
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "600", color: "#002347", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 8, marginTop: 12 },
  reasonList: { gap: 6 },
  reasonBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 4, alignItems: "center", gap: 12 },
  reasonBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#CCC", justifyContent: "center", alignItems: "center" },
  radioCircleActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  reasonText: { flex: 1, fontSize: 14, color: "#333" },
  reasonTextActive: { color: Colors.primary, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: { gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#F0F0F0", alignItems: "center" },
  cancelText: { fontSize: 15, color: "#666", fontFamily: Fonts.CairoSemiBold },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: "center" },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, color: "#fff", fontWeight: "600", fontFamily: Fonts.CairoSemiBold },
});

const viewerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    alignSelf: "center",
  },
});

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  center: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  errorText: { fontSize: 16, color: "#666", marginBottom: 16 },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backBtnText: { color: "#fff", fontWeight: "600" as const },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center",
    zIndex: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" as const },
  headerCenterButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center" as const,
  },
  headerCenter: { flex: 1 },
  headerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#002347",
    marginHorizontal: 8,
  },
  headerProjectButton: {
    maxWidth: "100%",
  },
  headerProject: { fontSize: 12, color: "#666", marginTop: 2, fontFamily: Fonts.CairoRegular, marginHorizontal: 8 },
  reportButton: { width: 40, height: 40, justifyContent: "center" as const, alignItems: "center" as const },
  keyboardView: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: "flex-end" as const,
    alignItems: "stretch" as const,
  },
  listContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  messageRow: { marginBottom: 12 },
  myMessageRow: { justifyContent: "flex-end" as const },
  theirMessageRow: { justifyContent: "flex-start" as const },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: { backgroundColor: Colors.primary },
  theirBubble: { backgroundColor: "#E8E8E8" },
  messageText: { fontSize: 15 },
  myText: { color: "#fff" },
  theirText: { color: "#333" },
  messageTime: { fontSize: 11, marginTop: 4 },
  myTime: { color: "rgba(255,255,255,0.8)" },
  theirTime: { color: "#999" },
  empty: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: "center" as const,
    fontFamily: Fonts.CairoSemiBold
  },
  attachmentsWrap: { marginBottom: 6 },
  mediaGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
  },
  mediaGridMulti: {
    width: 220,
  },
  attachmentImageWrap: { marginBottom: 6, borderRadius: 8, overflow: "hidden" as const },
  attachmentImage: { width: 200, height: 160, borderRadius: 8 },
  attachmentGridItem: {
    width: "48%" as const,
    aspectRatio: 1,
    marginBottom: 0,
  },
  attachmentGridImage: {
    width: "100%" as const,
    height: "100%" as const,
    borderRadius: 8,
  },
  attachmentVideoWrap: {
    position: "relative" as const,
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden" as const,
    width: 200,
    height: 160,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentVideoThumb: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#333",
  },
  playIconOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentDoc: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
    maxWidth: 220,
  },
  attachmentDocMe: { backgroundColor: "rgba(255,255,255,0.2)" },
  attachmentDocThem: { backgroundColor: "rgba(0,0,0,0.06)" },
  attachmentDocText: { flex: 1, fontSize: 13 },
  pendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#fff",
  },
  pendingItem: {
    position: "relative",
  },
  pendingThumb: {
    position: "relative" as const,
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden" as const,
  },
  pendingThumbImage: {
    width: 72,
    height: 72,
  },
  pendingThumbVideo: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingThumbPlay: {
    position: "absolute",
  },
  pendingRemove: {
    position: "absolute",
    top: -4,
    right: -4,
    padding: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  pendingChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: 72,
    height: 72,
    gap: 6,
  },
  pendingChipText: { flex: 1, fontSize: 11, color: "#333" },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  inputRow: {
    // padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#F5F5F5",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginLeft: 8,
  },
  sendDisabled: { opacity: 0.5 },
  blockedBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 12,
    alignItems: "flex-start",
  },
  blockedBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  blockedBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#78350F",
  },
  blockedBannerHint: {
    fontSize: 13,
    color: "#92400E",
    marginTop: 4,
    lineHeight: 18,
  },
  inputRowDisabled: {
    opacity: 0.55,
  },
};
