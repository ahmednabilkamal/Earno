import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import {
    interestService,
    ProjectInterest,
} from "@/services/interest-service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number, isRTL: boolean) {
  return (
    <View style={[styles.amountContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      <Text style={styles.amountValue}>{Number(amount).toLocaleString()}</Text>
      <Image
        source={require("@/assets/images/real_currency.png")}
        style={styles.currencySymbol}
        resizeMode="contain"
      />
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "accepted":
      return "#16a34a";
    case "rejected":
      return "#dc2626";
    default:
      return "#d97706";
  }
}

export default function ProjectInterestsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId: string; projectTitle?: string }>();
  const isRTL = i18n.language.startsWith("ar");
  const projectId = params.projectId || "";
  const projectTitle = params.projectTitle || t("project_interests", { defaultValue: "Project Interests" });

  const [interests, setInterests] = useState<ProjectInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInterests = useCallback(
    async (pageNum = 1, append = false) => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      try {
        if (pageNum === 1) {
          append ? setRefreshing(true) : setIsLoading(true);
        } else {
          setLoadingMore(true);
        }
        const result = await interestService.getProjectInterests(projectId, pageNum);
        if (append) {
          setInterests((prev) => (pageNum === 1 ? result.data : [...prev, ...result.data]));
        } else {
          setInterests(result.data);
        }
        setHasMore(result.meta.current_page < result.meta.last_page);
        setPage(pageNum);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error?.message || t("failed_to_load_interests", { defaultValue: "Failed to load interests" }),
        });
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [projectId, t]
  );

  useEffect(() => {
    loadInterests(1);
  }, [loadInterests]);

  const handleRefresh = useCallback(() => {
    loadInterests(1, true);
  }, [loadInterests]);

  const handleStartConversation = useCallback(
    (interest: ProjectInterest) => {
      const userId = interest.user?.id || interest.user_id;
      const userName =
        interest.user?.name ||
        interest.user?.investor_profile?.company ||
        t("investor", { defaultValue: "Investor" });
      if (!userId) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("owner_contact_not_available", { defaultValue: "Contact not available" }),
        });
        return;
      }
      router.push({
        pathname: "/chat",
        params: {
          otherUserId: String(userId),
          otherUserName: userName,
          projectId: params.projectId || "",
          projectTitle: projectTitle,
        },
      });
    },
    [router, params.projectId, projectTitle, t]
  );

  const renderItem = ({ item }: { item: ProjectInterest }) => {
    const investorName =
      item.user?.name ||
      item.user?.investor_profile?.company ||
      t("investor", { defaultValue: "Investor" });
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.card, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[styles.cardContent, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.investorName, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold }]}>
            {investorName}
          </Text>
          <View style={[styles.amount, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            {formatAmount(item.investment_amount, isRTL)}
          </View>
          {item.message ? (
            <Text
              style={[styles.message, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          ) : null}
          <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={[styles.statusText, { fontFamily: Fonts.CairoBold }]}>{t(`status_${item.status}`, { defaultValue: item.status })}</Text>
            </View>
            <Text style={[styles.date, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.chatButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => handleStartConversation(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.primary} />
            <Text style={[styles.chatButtonText, isRTL ? { marginRight: 8 } : { marginLeft: 8 }, { fontFamily: Fonts.CairoBold }]}>
              {t("start_conversation", { defaultValue: "Start Conversation" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!projectId) {
    return (
      <View style={styles.container}>
        <GradientOverlay />
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <Text style={[styles.errorText, { fontFamily: Fonts.CairoRegular }]}>{t("project_not_found", { defaultValue: "Project not found" })}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { fontFamily: Fonts.CairoBold }]}>{t("go_back", { defaultValue: "Go Back" })}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GradientOverlay />
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientOverlay />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24}
              color={Colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold }]} numberOfLines={1}>
            {t("project_interests", { defaultValue: "Project Interests" })}
          </Text>
        </View>

        {interests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyTitle, { textAlign: "center", fontFamily: Fonts.CairoBold }]}>
              {t("no_interests_yet", { defaultValue: "No interests yet" })}
            </Text>
            <Text style={[styles.emptyDesc, { textAlign: "center", fontFamily: Fonts.CairoRegular }]}>
              {t("no_interests_description", {
                defaultValue: "Interested investors will appear here when they express interest in your project.",
              })}
            </Text>
          </View>
        ) : (
          <FlatList
            data={interests}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListFooterComponent={
              hasMore && loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
            onEndReached={() => {
              if (!loadingMore && hasMore) loadInterests(page + 1, true);
            }}
            onEndReachedThreshold={0.3}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#002347",
  },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardContent: { flex: 1 },
  investorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002347",
    marginBottom: 4,
  },
  amount: {
    marginBottom: 4,
  },
  amountContent: {
    alignItems: "center",
    gap: 6,
  },
  amountValue: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: Fonts.CairoBold,
  },
  currencySymbol: {
    width: 16,
    height: 16,
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  row: { alignItems: "center", gap: 8, marginBottom: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  date: { fontSize: 12, color: "#888" },
  chatButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMore: { padding: 16, alignItems: "center" },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 48,
  },
  backBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
