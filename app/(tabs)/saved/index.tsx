import { ProjectItem } from "@/components/ProjectItem";
import { SavedTabSkeleton } from "@/components/ui/home-skeleton";
import { NetworkErrorScreen } from "@/components/ui/network-error-screen";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Project, projectService } from "@/services/project-service";
import { isNetworkOrServerError } from "@/utils/network-error";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const EmptyFavorites = ({
  t,
  isRTL,
  isInvestor,
  onAddProject,
  onAddInvestorProject,
}: {
  t: any;
  isRTL: boolean;
  isInvestor: boolean;
  onAddProject: () => void;
  onAddInvestorProject: () => void;
}) => (
  <View style={styles.emptyContainer}>
    {/* Illustration Section */}
    <View style={styles.illustrationContainer}>
      <Image
        source={require("@/assets/images/no_projects_found.png")}
        resizeMode="cover"
      />
    </View>

    {/* Text Content - Both owner and investor see "My Projects" tab */}
    <Text style={[styles.emptyTitle, { textAlign: "center" }]}>
      {t("no_projects_yet", { defaultValue: "No projects yet" })}
    </Text>
    <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>
      {isInvestor
        ? t("no_projects_description", {
          defaultValue: "Start creating your first investment opportunity",
        })
        : t("no_projects_description", {
          defaultValue: "Start creating your first project",
        })}
    </Text>

    {/* Action Button - Owners add project, investors add investment opportunity */}
    {!isInvestor && (
      <TouchableOpacity
        style={styles.addProjectButton}
        activeOpacity={0.8}
        onPress={onAddProject}
      >
        <Text style={styles.addProjectButtonText}>
          {t("add_new_project", { defaultValue: "Add New Project" })}
        </Text>
      </TouchableOpacity>
    )}
    {isInvestor && (
      <TouchableOpacity
        style={styles.addProjectButton}
        activeOpacity={0.8}
        onPress={onAddInvestorProject}
      >
        <Text style={styles.addProjectButtonText}>
          {t("investor_seeking_cta")}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function SavedScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated, user } = useAuthStore();
  const isInvestor = user?.user_type === "investor";
  const isOwner = user?.user_type === "project_owner";

  const [favorites, setFavorites] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchProjects = useCallback(
    async (search: string, isRefresh = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setFavorites([]);
        return;
      }

      try {
        if (!isRefresh) setIsLoading(true);

        if (isInvestor) {
          // Fetch investor's own projects (like project owner's my projects)
          const response = await projectService.getInvestorProjects(page, 50);
          let projects = response.projects;
          if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            projects = projects.filter(
              (p) =>
                (p.title ?? "").toLowerCase().includes(q) ||
                (p.description ?? "").toLowerCase().includes(q)
            );
          }
          setFavorites(projects);
          setNetworkError(false);
        } else if (isOwner) {
          // Fetch owner projects
          const response = await projectService.getOwnerProjects(
            page,
            15,
            undefined,
            undefined,
            search
          );
          setFavorites(response.projects);
          setNetworkError(false);
        } else {
          setFavorites([]);
        }
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        if (isNetworkOrServerError(error)) {
          setNetworkError(true);
        } else {
          Toast.show({
            type: "error",
            text1: t("error"),
            text2:
              error.message ||
              (isInvestor
                ? t("failed_to_load_favorites", {
                  defaultValue: "Failed to load favorites",
                })
                : t("failed_to_load_projects", {
                  defaultValue: "Failed to load projects",
                })),
          });
        }
        setFavorites([]);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, isInvestor, isOwner, page, t]
  );

  const onRefresh = useCallback(() => {
    setNetworkError(false);
    setRefreshing(true);
    setPage(1);
    fetchProjects(searchQuery, true);
  }, [fetchProjects, searchQuery]);

  const handleRetryNetwork = useCallback(() => {
    setNetworkError(false);
    fetchProjects(searchQuery, true);
  }, [fetchProjects, searchQuery]);

  // Initial fetch and when authenticated status or user type changes
  useEffect(() => {
    if (isAuthenticated && (isInvestor || isOwner)) {
      fetchProjects("");
    } else {
      setFavorites([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isInvestor, isOwner, fetchProjects]);

  // Debounced search effect
  useEffect(() => {
    if (!isAuthenticated || (!isInvestor && !isOwner)) return;

    const timeoutId = setTimeout(() => {
      fetchProjects(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isAuthenticated, isInvestor, isOwner, fetchProjects]);

  // Fetch projects when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && (isInvestor || isOwner)) {
        fetchProjects(searchQuery);
      } else {
        setFavorites([]);
        setIsLoading(false);
      }
    }, [isAuthenticated, isInvestor, isOwner, fetchProjects, searchQuery])
  );

  if (networkError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GradientOverlay />
        <NetworkErrorScreen onRetry={handleRetryNetwork} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GradientOverlay />
      {isLoading && favorites.length === 0 ? (
        <View style={[styles.loadingContainer, styles.contentAbove]}>
          <SavedTabSkeleton isRTL={isRTL} />
        </View>
      ) : (
        <FlatList
          style={styles.contentAbove}
          data={favorites}
          renderItem={({ item }) => (
            <ProjectItem
              item={item}
              isFavorite
              openedFromFavorites
              isOwnProject
              onFavoriteChange={(projectId, isFavorite) => {
                if (!isFavorite) {
                  setFavorites((prev) => prev.filter((p) => p.id !== projectId));
                }
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            favorites.length === 0
              ? styles.emptyScrollContent
              : styles.scrollContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyFavorites
                t={t}
                isRTL={isRTL}
                isInvestor={isInvestor}
                onAddProject={() => router.push("/add-project")}
                onAddInvestorProject={() => router.push("/add-investor-project")}
              />
            ) : null
          }
          ListHeaderComponent={
            <>
              {/* Header — aligned with Messages tab */}
              <View
                style={[
                  styles.header,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>
                  {t("my_projects", { defaultValue: "My Projects" })}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Search Bar */}
              <View
                style={[
                  styles.searchContainer,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View
                  style={[
                    styles.searchBar,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <Ionicons name="search-outline" size={20} color="#999" />
                  <TextInput
                    placeholder={t("search_here")}
                    style={[
                      styles.searchInput,
                      { textAlign: isRTL ? "right" : "left" },
                      isRTL ? { marginRight: 10 } : { marginLeft: 10 },
                    ]}
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    {...withoutCredentialAutofill()}
                  />
                </View>
              </View>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}
