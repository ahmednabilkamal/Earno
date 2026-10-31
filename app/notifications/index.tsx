import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { REALTIME_CONFIG } from "@/constants/realtime";
import {
  AppNotification,
  notificationService,
} from "@/services/notification-service";
import { realtimeSyncService } from "@/services/realtime-sync-service";
import { getLocalizedNotificationText } from "@/utils/notification-display";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import styles from "./styles";

function formatNotificationTime(
  iso: string,
  locale: string
): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const list = await notificationService.getNotifications();
      setItems(list);
    } catch (e: unknown) {
      const axiosErr = e as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        "";
      const displayError =
        message ||
        (i18n.language === "ar"
          ? "تعذر تحميل الإشعارات"
          : "Failed to load notifications");
      setError(displayError);
      setItems([]);
      if (isRefresh) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: displayError,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [i18n.language, t]);

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  useEffect(() => {
    const markReadOnOpen = async () => {
      try {
        await notificationService.markAllAsRead();
        setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
        realtimeSyncService.emit("notifications_updated");
      } catch {
        // Keep list usable even if marking read fails.
      }
    };

    markReadOnOpen();
  }, []);

  useEffect(() => {
    const stopPolling = notificationService.watchNotifications(
      () => {
        fetchNotifications(false);
      },
      { intervalMs: REALTIME_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MS }
    );

    const unsubscribe = realtimeSyncService.subscribe("notifications_updated", () => {
      fetchNotifications(false);
    });

    return () => {
      stopPolling();
      unsubscribe();
    };
  }, [fetchNotifications]);

  const onRefresh = () => {
    fetchNotifications(true);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const { title: displayTitle, body: displayBody } =
      getLocalizedNotificationText(item, t);
    const timeLabel = formatNotificationTime(item.createdAt, i18n.language);
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#67A6B8" />
        </View>
        <View
          style={[
            styles.contentContainer,
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <Text
            style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            numberOfLines={3}
          >
            {displayTitle}
          </Text>
          {displayBody ? (
            <Text
              style={[styles.body, { textAlign: isRTL ? "right" : "left" }]}
              numberOfLines={4}
            >
              {displayBody}
            </Text>
          ) : null}
          {timeLabel ? (
            <Text style={[styles.time, { textAlign: isRTL ? "right" : "left" }]}>
              {timeLabel}
            </Text>
          ) : null}
        </View>
        {!item.isRead ? (
          <View style={styles.unreadDot} />
        ) : (
          <View style={{ width: 8 }} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchNotifications(false)}
          >
            <Text style={styles.retryText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={Colors.placeholder}
        />
        <Text
          style={[
            styles.emptyText,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("no_notifications_yet", {
            defaultValue: "No notifications yet.",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientOverlay />
      <View style={styles.contentAbove}>
        <View
          style={[
            styles.header,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24}
              color="#002347"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notifications")}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              items.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
