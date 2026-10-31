import { ProjectItem } from "@/components/ProjectItem";
import {
  CategoryBottomSheet,
  CategoryBottomSheetRef,
} from "@/components/ui/category-bottom-sheet";
import {
  PriceRangeBottomSheet,
  PriceRangeBottomSheetRef,
  PriceRangeValue,
} from "@/components/ui/price-range-bottom-sheet";
import {
  ProjectTypeBottomSheet,
  ProjectTypeBottomSheetRef,
} from "@/components/ui/project-type-bottom-sheet";
import {
  SortBottomSheet,
  SortBottomSheetRef,
  SortValue,
} from "@/components/ui/sort-bottom-sheet";
import { Colors } from "@/constants/colors";
import {
  Category,
  getCategoryDisplayName,
  Project,
  projectService,
} from "@/services/project-service";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Project[]>([]);
  const [latestProjects, setLatestProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortValue, setSortValue] = useState<SortValue>({ sortBy: "created_at", sortOrder: "desc" });
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<PriceRangeValue>({});
  const [categoriesRaw, setCategoriesRaw] = useState<Category[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categorySheetRef = useRef<CategoryBottomSheetRef>(null);
  const sortSheetRef = useRef<SortBottomSheetRef>(null);
  const filterScrollRef = useRef<ScrollView>(null);
  const projectTypeSheetRef = useRef<ProjectTypeBottomSheetRef>(null);
  const priceRangeSheetRef = useRef<PriceRangeBottomSheetRef>(null);

  const categoriesForSheet = useMemo(
    () =>
      categoriesRaw.map((cat) => ({
        id: cat.id.toString(),
        name: getCategoryDisplayName(cat, i18n.language),
        icon: null as string | null,
      })),
    [categoriesRaw, i18n.language],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const apiCategories = await projectService.getCategories();
      setCategoriesRaw(apiCategories);
    } catch {
      setCategoriesRaw([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isRTL && filterScrollRef.current) {
      setTimeout(() => filterScrollRef.current?.scrollToEnd({ animated: false }), 0);
    }
  }, [isRTL]);

  const fetchLatestProjects = useCallback(async () => {
    setLoadingLatest(true);
    try {
      const response = await projectService.getProjects(
        1,
        20,
        "",
        "all",
        categoryFilter === "all" ? "all" : categoryFilter,
        {
          sortBy: sortValue.sortBy,
          sortOrder: sortValue.sortOrder,
          projectType: projectTypeFilter === "all" ? undefined : projectTypeFilter,
          investmentMin: priceRange.investmentMin,
          investmentMax: priceRange.investmentMax,
        }
      );
      setLatestProjects(response.projects || []);
    } catch {
      setLatestProjects([]);
    } finally {
      setLoadingLatest(false);
    }
  }, [categoryFilter, projectTypeFilter, priceRange, sortValue]);

  useEffect(() => {
    if (query.trim()) return;
    fetchLatestProjects();
  }, [query, fetchLatestProjects]);

  const search = useCallback(
    async (
      q: string,
      category = categoryFilter,
      projectType = projectTypeFilter,
      range: PriceRangeValue = priceRange,
      sort = sortValue
    ) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setHasSearched(true);
      setLoading(true);
      try {
        const response = await projectService.getProjects(
          1,
          20,
          trimmed,
          "all",
          category === "all" ? "all" : category,
          {
            sortBy: sort.sortBy,
            sortOrder: sort.sortOrder,
            projectType: projectType === "all" ? undefined : projectType,
            investmentMin: range.investmentMin,
            investmentMax: range.investmentMax,
          }
        );
        setResults(response.projects || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
    }
    },
    [categoryFilter, projectTypeFilter, priceRange, sortValue]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query, categoryFilter, projectTypeFilter, priceRange, sortValue);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, categoryFilter, projectTypeFilter, priceRange, sortValue]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const isSearchMode = query.trim().length > 0;
  const mainLoading = isSearchMode ? loading : loadingLatest;
  const listData = isSearchMode ? results : latestProjects;
  const showNoResults =
    isSearchMode && hasSearched && !loading && results.length === 0 && query.trim().length > 0;
  const showLatestEmpty =
    !isSearchMode && !loadingLatest && latestProjects.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24}
            color={Colors.text.primary}
          />
        </Pressable>
        <View style={[styles.searchBarWrap, isRTL ? { marginRight: 12, marginLeft: 0 } : { marginLeft: 12 }]}>
          <View style={[styles.searchBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Ionicons
              name="search-outline"
              size={22}
              color={Colors.text.light}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.searchInput,
                { textAlign: isRTL ? "right" : "left" },
                isRTL ? { marginRight: 10 } : { marginLeft: 10 },
              ]}
              placeholder={t("search_here")}
              placeholderTextColor={Colors.text.light}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => Keyboard.dismiss()}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              {...withoutCredentialAutofill()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Ionicons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter row: Project Type, Sort, Price Range, Categories. RTL: starts from right */}
      <View style={styles.filterChipsRowWrap}>
        <ScrollView
          ref={filterScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterChipsRow, { flexDirection: isRTL ? "row-reverse" : "row", flexGrow: 1, justifyContent: isRTL ? "flex-end" : "flex-start" }]}
        >
          <TouchableOpacity
            style={[styles.filterChipButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => projectTypeSheetRef.current?.open()}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipButtonText} numberOfLines={1}>{t("project_type")}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.text.primary} style={isRTL ? { marginRight: 6 } : { marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChipButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => sortSheetRef.current?.open()}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipButtonText} numberOfLines={1}>
              {sortValue.sortBy === "created_at" ? t("sort_latest") : sortValue.sortOrder === "asc" ? t("sort_price_low_high") : t("sort_price_high_low")}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.text.primary} style={isRTL ? { marginRight: 6 } : { marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChipButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => priceRangeSheetRef.current?.open()}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipButtonText} numberOfLines={1}>{t("price_range")}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.text.primary} style={isRTL ? { marginRight: 6 } : { marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChipButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => categorySheetRef.current?.open()}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipButtonText} numberOfLines={1}>{t("categories")}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.text.primary} style={isRTL ? { marginRight: 6 } : { marginLeft: 6 }} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {mainLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {!mainLoading && showLatestEmpty && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search-outline" size={36} color={Colors.text.light} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("search_projects", { defaultValue: "Search projects" })}
          </Text>
          <Text style={[styles.emptySubtitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("search_projects_hint", { defaultValue: "Enter a project name, category, or keyword to find opportunities." })}
          </Text>
        </View>
      )}

      {!mainLoading && showNoResults && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={36} color={Colors.text.light} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("no_projects_found")}
          </Text>
          <Text style={[styles.emptySubtitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("search_no_results_hint", { defaultValue: "Try different keywords or check the spelling." })}
          </Text>
        </View>
      )}

      {!mainLoading && listData.length > 0 && (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectItem
              item={item}
              omitHorizontalMargin
              onFavoriteChange={(projectId, isFavorite) => {
                const updater = (prev: Project[]) =>
                  prev.map((p) =>
                    p.id === projectId ? { ...p, isFavourite: isFavorite } : p
                  );
                if (isSearchMode) setResults(updater);
                else setLatestProjects(updater);
              }}
            />
          )}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text
              style={[
                styles.resultsCount,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {isSearchMode
                ? t("search_results_count", { count: listData.length })
                : t("best_opportunities")}
            </Text>
          }
        />
      )}

      <SortBottomSheet
        ref={sortSheetRef}
        initialValue={sortValue}
        onApply={(value) => {
          setSortValue(value);
          if (query.trim()) search(query, categoryFilter, projectTypeFilter, priceRange, value);
        }}
      />
      <CategoryBottomSheet
        ref={categorySheetRef}
        categories={categoriesForSheet}
        initialValue={categoryFilter}
        onApply={(categoryId) => {
          setCategoryFilter(categoryId);
          if (query.trim()) search(query, categoryId, projectTypeFilter, priceRange, sortValue);
        }}
      />
      <ProjectTypeBottomSheet
        ref={projectTypeSheetRef}
        initialValue={projectTypeFilter}
        onApply={(projectType) => {
          setProjectTypeFilter(projectType);
          if (query.trim()) search(query, categoryFilter, projectType, priceRange, sortValue);
        }}
      />
      <PriceRangeBottomSheet
        ref={priceRangeSheetRef}
        initialRange={priceRange}
        onApply={(range) => {
          setPriceRange(range);
          if (query.trim()) search(query, categoryFilter, projectTypeFilter, range, sortValue);
        }}
      />
    </SafeAreaView>
  );
}
