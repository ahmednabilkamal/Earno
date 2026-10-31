import { ProjectItem } from "@/components/ProjectItem";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { SavedTabSkeleton } from "@/components/ui/home-skeleton";
import { NetworkErrorScreen } from "@/components/ui/network-error-screen";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Project, projectService } from "@/services/project-service";
import { useAuthStore } from "@/store/auth-store";
import { isNetworkOrServerError } from "@/utils/network-error";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const EmptyFavorites = ({ t, isRTL, onExplore }: { t: any; isRTL: boolean; onExplore: () => void }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.illustrationContainer}>
      <Image
        source={require("@/assets/images/no_projects_found.png")}
        resizeMode="cover"
      />
    </View>
    <Text style={[styles.emptyTitle, { textAlign: "center" }]}>
      {t("no_favorites_yet", { defaultValue: "No favorites yet" })}
    </Text>
    <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>
      {t("no_favorites_description", {
        defaultValue: "Start exploring projects and add them to your favorites",
      })}
    </Text>
  </View>
);

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated } = useAuthStore();

  const [favorites, setFavorites] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;

  const fetchFavorites = useCallback(
    async (search: string, isRefresh = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setFavorites([]);
        return;
      }

      try {
        if (!isRefresh) setIsLoading(true);
        const response = await projectService.getFavorites(search);
        setFavorites(response.projects);
        setNetworkError(false);
      } catch (error: any) {
        if (isNetworkOrServerError(error)) {
          setNetworkError(true);
        } else {
          Toast.show({
            type: "error",
            text1: t("error"),
            text2:
              error.message ||
              t("failed_to_load_favorites", {
                defaultValue: "Failed to load favorites",
              }),
          });
        }
        setFavorites([]);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, t]
  );

  const onRefresh = useCallback(() => {
    setNetworkError(false);
    setRefreshing(true);
    fetchFavorites(searchRef.current, true);
  }, [fetchFavorites]);

  const handleRetryNetwork = useCallback(() => {
    setNetworkError(false);
    fetchFavorites(searchRef.current, true);
  }, [fetchFavorites]);

  const handleExplore = useCallback(() => {
    // Navigate to explore/projects screen
    // This can be implemented based on your navigation structure
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites("");
    } else {
      setFavorites([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchFavorites]);

  // Debounced search
  useEffect(() => {
    if (!isAuthenticated) return;
    const timeoutId = setTimeout(() => {
      fetchFavorites(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isAuthenticated, fetchFavorites]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchFavorites(searchRef.current);
      }
    }, [isAuthenticated, fetchFavorites])
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
              onFavoriteChange={(projectId, isFav) => {
                if (!isFav) {
                  setFavorites((prev) =>
                    prev.filter((p) => p.id !== projectId)
                  );
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
            !isLoading ? <EmptyFavorites t={t} isRTL={isRTL} /> : null
          }
          ListHeaderComponent={
            <>
              <View
                style={[
                  styles.header,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>
                  {t("favorites_label", { defaultValue: "Favorites" })}
                </Text>
                <View style={{ width: 40 }} />
              </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.primary,
  },
});
