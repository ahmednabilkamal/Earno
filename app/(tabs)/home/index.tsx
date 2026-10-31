import { ProjectItem } from "@/components/ProjectItem";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { HomeSkeleton } from "@/components/ui/home-skeleton";
import { NetworkErrorScreen } from "@/components/ui/network-error-screen";
import { Colors } from "@/constants/colors";
import { REALTIME_CONFIG } from "@/constants/realtime";
import { authService } from "@/services/auth-service";
import { investorService } from "@/services/investor-service";
import { notificationService } from "@/services/notification-service";
import { Project, projectService } from "@/services/project-service";
import { realtimeSyncService } from "@/services/realtime-sync-service";
import { isNetworkOrServerError } from "@/utils/network-error";
import { resolveProfilePhotoUrl } from "@/utils/profile-photo";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const EmptyProjects = ({
  t,
  isRTL,
  onAddProject,
  onAddInvestorProject,
  isProjectOwner,
  isInvestor,
}: {
  t: any;
  isRTL: boolean;
  onAddProject: () => void;
  onAddInvestorProject: () => void;
  isProjectOwner: boolean;
  isInvestor: boolean;
}) => (
  <View style={styles.emptyContainer}>
    {/* Illustration Section */}
    <View style={styles.illustrationContainer}>
      <Image
        source={require("@/assets/images/no_projects_found.png")}
        resizeMode="cover"
      />
    </View>

    {/* Text Content */}
    <Text style={[styles.emptyTitle, { textAlign: "center" }]}>
      {t("no_projects_yet")}
    </Text>
    <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>
      {t("no_projects_description")}
    </Text>

    {/* Action Button - Project owners add project, investors add investment opportunity */}
    {isProjectOwner && (
      <TouchableOpacity
        style={styles.addProjectButton}
        activeOpacity={0.8}
        onPress={onAddProject}
      >
        <Text style={styles.addProjectButtonText}>{t("add_new_project")}</Text>
      </TouchableOpacity>
    )}
    {isInvestor && (
      <TouchableOpacity
        style={styles.addProjectButton}
        activeOpacity={0.8}
        onPress={onAddInvestorProject}
      >
        <Text style={styles.addProjectButtonText}>{t("investor_seeking_cta")}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const projectListRef = useRef<FlatList>(null);

  const { user, updateUser } = useAuthStore();
  const [opportunities, setOpportunities] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter] = useState("all");
  const [investorMaxInvestment, setInvestorMaxInvestment] = useState<number | null>(null);
  const [homeAvatarFailed, setHomeAvatarFailed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const rawHomeProfilePhoto = user?.avatar || user?.profile_photo_url;
  const homeProfilePhotoUri = resolveProfilePhotoUrl(rawHomeProfilePhoto);

  useEffect(() => {
    setHomeAvatarFailed(false);
  }, [rawHomeProfilePhoto]);

  const isProjectOwner = user?.user_type === "project_owner";
  const isInvestor = user?.user_type === "investor";

  const fetchProjects = useCallback(
    async (
      p = page,
      status = statusFilter,
      withLoader: boolean = true,
      overrideMaxInvestment?: number | null
    ) => {
      try {
        if (withLoader && p === 1) setIsLoadingProjects(true);
        const options: { investmentMin?: number; investmentMax?: number } = {};
        const maxCap = overrideMaxInvestment !== undefined ? overrideMaxInvestment : investorMaxInvestment;
        if (isInvestor && maxCap != null && maxCap > 0) {
          options.investmentMin = 1;
          options.investmentMax = maxCap;
        }
        const response = await projectService.getProjects(
          p,
          perPage,
          "",
          status,
          undefined,
          Object.keys(options).length > 0 ? options : undefined
        );
        setOpportunities(response.projects);
        setNetworkError(false);
      } catch (error) {
        if (isNetworkOrServerError(error)) setNetworkError(true);
        setOpportunities([]);
      } finally {
        if (withLoader) {
          setIsLoadingProjects(false);
          setRefreshing(false);
        }
      }
    },
    [page, perPage, statusFilter, isInvestor, investorMaxInvestment]
  );

  const onRefresh = () => {
    setNetworkError(false);
    setRefreshing(true);
    setPage(1);
    fetchProjects(1, statusFilter);
    projectListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadNotifications(res.count);
    } catch {
      // Keep existing badge value on transient failures.
    }
  }, []);

  const handleRetryNetwork = () => {
    setNetworkError(false);
    setPage(1);
    onRefresh();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        updateUser(response.user);
      } catch { }
    };

    const fetchInvestorProfile = async () => {
      try {
        const data = await investorService.getProfile();
        const max = data.profile?.max_investment_amount;
        if (max != null && typeof max === "number" && max > 0) {
          setInvestorMaxInvestment(max);
          fetchProjects(1, statusFilter, false, max);
        }
      } catch { }
    };

    fetchProfile();
    const minSkeletonMs = 700;
    const fetchInitialData = async () => {
      const startedAt = Date.now();
      try {
        setIsLoadingProjects(true);
        await fetchProjects(1, statusFilter, false);
        if (user?.user_type === "investor") {
          fetchInvestorProfile();
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const waitLeft = Math.max(0, minSkeletonMs - elapsed);
        setTimeout(() => {
          setIsLoadingProjects(false);
          setRefreshing(false);
        }, waitLeft);
      }
    };

    fetchInitialData();

    // Log push token for debugging (Android: needs FCM V1 on expo.dev)
    void import("@/services/push-notification-service").then(
      ({ registerForPushNotificationsWithDetailsAsync }) =>
        registerForPushNotificationsWithDetailsAsync().then(({ token, error }) => {
          if (token) {
            console.log("[HomeScreen] Push token OK:", token);
          } else {
            console.warn("[HomeScreen] Push token failed:", error ?? "unknown");
          }
        })
    );
  }, [
    updateUser,
    fetchProjects,
    statusFilter,
    user?.user_type,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadNotifications();

      const stopNotificationsPolling = notificationService.watchNotifications(
        ({ unreadCount }) => setUnreadNotifications(unreadCount),
        { intervalMs: REALTIME_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MS }
      );

      const unsubscribeNotifications = realtimeSyncService.subscribe("notifications_updated", () => {
        void refreshUnreadNotifications();
      });

      return () => {
        stopNotificationsPolling();
        unsubscribeNotifications();
      };
    }, [refreshUnreadNotifications])
  );


  if (networkError) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientOverlay />
        <NetworkErrorScreen onRetry={handleRetryNetwork} />
      </SafeAreaView>
    );
  }

  if (isLoadingProjects && opportunities.length === 0) {
    const { height: screenHeight } = Dimensions.get("window");
    return (
      <SafeAreaView style={styles.container}>
        <GradientOverlay />
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, minHeight: screenHeight - 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <HomeSkeleton isRTL={isRTL} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientOverlay />
      <FlatList
        ref={projectListRef}
        data={opportunities}
        renderItem={({ item }) => (
          <ProjectItem
            item={item}
            onFavoriteChange={(projectId, isFavorite) => {
              setOpportunities((prev) =>
                prev.map((p) =>
                  p.id === projectId ? { ...p, isFavourite: isFavorite } : p
                )
              );
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          opportunities.length === 0
            ? styles.emptyScrollContent
            : styles.scrollContent
        }
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View
              style={[
                styles.header,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[
                  styles.userInfo,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                {homeProfilePhotoUri && !homeAvatarFailed ? (
                  <Image
                    source={{ uri: homeProfilePhotoUri }}
                    style={[
                      styles.avatar,
                      isRTL ? { marginLeft: 10 } : { marginRight: 10 },
                    ]}
                    resizeMode="cover"
                    onError={() => setHomeAvatarFailed(true)}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarPlaceholder,
                      isRTL ? { marginLeft: 10 } : { marginRight: 10 },
                    ]}
                  >
                    <Ionicons name="person" size={28} color="#999" />
                  </View>
                )}
                <View
                  style={[
                    styles.greetingContainer,
                    {
                      alignItems: isRTL ? "flex-end" : "flex-start",
                      alignSelf: "stretch",
                      flex: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.greeting,
                      { textAlign: isRTL ? "right" : "left", width: "100%" },
                    ]}
                  >
                    {i18n.language === "ar"
                      ? `مرحباً ${user?.name} !`
                      : `Hello ${user?.name} !`}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={[
                      styles.subGreeting,
                      {
                        textAlign: isRTL ? "right" : "left",
                        width: "100%",
                        maxWidth: isRTL ? undefined : 240,
                      },
                    ]}
                  >
                    {t("greeting_desc")}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push("/notifications")}
                hitSlop={12}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("notifications", { defaultValue: "Notifications" })}
              >
                <Ionicons name="notifications-outline" size={22} color="#002347" />
                {unreadNotifications > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.searchBar,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
                onPress={() => router.push("/search")}
                activeOpacity={0.9}
              >
                <Ionicons name="search-outline" size={20} color="#999" />
                <Text
                  style={[
                    styles.searchInput,
                    { textAlign: isRTL ? "right" : "left" },
                    isRTL ? { marginRight: 10 } : { marginLeft: 10 },
                    { color: Colors.text.light },
                  ]}
                  numberOfLines={1}
                >
                  {t("search_here")}
                </Text>
              </TouchableOpacity>
            </View>

            {opportunities?.length !== 0 && (
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("best_opportunities")}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyProjects
            t={t}
            isRTL={isRTL}
            onAddProject={() => router.push("/add-project")}
            onAddInvestorProject={() => router.push("/add-investor-project")}
            isProjectOwner={isProjectOwner}
            isInvestor={isInvestor}
          />
        }
      />

      {/* Floating Action Button - Project owners add project, investors add investment opportunity */}
      {isProjectOwner && (
        <TouchableOpacity
          style={[styles.fab, { [isRTL ? "left" : "right"]: 20 }]}
          activeOpacity={0.8}
          onPress={() => router.push("/add-project")}
        >
          <Ionicons name="add" size={32} color={Colors.white} />
        </TouchableOpacity>
      )}
      {isInvestor && (
        <TouchableOpacity
          style={[styles.fab, { [isRTL ? "left" : "right"]: 20 }]}
          activeOpacity={0.8}
          onPress={() => router.push("/add-investor-project")}
        >
          <Ionicons name="add" size={32} color={Colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
