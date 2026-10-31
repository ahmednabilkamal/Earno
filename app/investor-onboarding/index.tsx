import { ThemedText } from "@/components/themed-text";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import CustomInput from "@/components/ui/custom-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Fonts } from "@/constants/fonts";
import {
  PARTNERSHIP_TYPES,
  PREFERRED_INVESTMENT_TYPES,
} from "@/constants/investor-onboarding-options";
import { investorService } from "@/services/investor-service";
import { City, projectService } from "@/services/project-service";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import styles from "./styles";

const MAX_INVESTMENT_PRESETS = [
  { value: "50000", labelKey: "inv_range_less_50k" },
  { value: "200000", labelKey: "inv_range_50k_200k" },
  { value: "500000", labelKey: "inv_range_200k_500k" },
  { value: "1000000", labelKey: "inv_range_500k_1m" },
  { value: "5000000", labelKey: "inv_range_more_1m" },
  { value: "10000000", labelKey: "onboarding_no_limit" },
];
const NO_LIMIT_VALUE = 999999999;

export default function InvestorOnboardingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === "ar";

  const [riskTolerance, setRiskTolerance] = useState("");
  const [maxInvestmentAmount, setMaxInvestmentAmount] = useState<string>("");
  const [partnershipPercentageInput, setPartnershipPercentageInput] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [preferredCategoryIds, setPreferredCategoryIds] = useState<number[]>([]);
  const [otherCategorySelected, setOtherCategorySelected] = useState(false);
  const [preferredCategoriesOther, setPreferredCategoriesOther] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [preferredPartnershipTypes, setPreferredPartnershipTypes] = useState<string[]>([]);
  const [preferredInvestmentType, setPreferredInvestmentType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    try {
      const list = await projectService.getCategories();
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      const list = await projectService.getCities();
      setCities(list);
    } catch {
      setCities([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCities();
  }, [fetchCategories, fetchCities]);

  const maxInvestmentOptions = useMemo(
    () =>
      MAX_INVESTMENT_PRESETS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );
  const cityOptions = useMemo(
    () => [
      { value: "all", label: t("all") },
      ...cities.map((c) => ({
        value: c.name,
        label: isRTL && c.name_ar ? c.name_ar : c.name,
      })),
    ],
    [cities, isRTL, t]
  );
  const investmentTypeOptions = useMemo(
    () =>
      PREFERRED_INVESTMENT_TYPES.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );

  const toggleCategory = (id: number) => {
    setPreferredCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    if (errors.preferredCategories) setErrors((e) => ({ ...e, preferredCategories: "" }));
  };

  const onLocationSelect = (value: string) => {
    setPreferredLocations(value === "all" ? [] : [value]);
  };

  const togglePartnershipType = (value: string) => {
    setPreferredPartnershipTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!maxInvestmentAmount || parseInt(maxInvestmentAmount, 10) < 1)
      next.maxInvestment = t("onboarding_capital");
    const hasCategories =
      preferredCategoryIds.length > 0 ||
      (otherCategorySelected && preferredCategoriesOther.trim().length > 0);
    if (!hasCategories) next.preferredCategories = t("onboarding_projects_interested");
    if (!preferredInvestmentType) next.preferredInvestmentType = t("onboarding_investment_type");
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [
    maxInvestmentAmount,
    preferredCategoryIds,
    otherCategorySelected,
    preferredCategoriesOther,
    preferredInvestmentType,
    t,
  ]);

  const handleSkip = () => {
    router.replace("/home");
  };

  const handleSave = async () => {
    if (!validate()) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("onboarding_required_fields"),
      });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const maxAmount =
        maxInvestmentAmount === "10000000" || parseInt(maxInvestmentAmount, 10) >= 10000000
          ? NO_LIMIT_VALUE
          : parseInt(maxInvestmentAmount, 10) || 1;
      await investorService.updateProfile({
        risk_tolerance: riskTolerance.trim() || undefined,
        min_investment_amount: 1,
        max_investment_amount: maxAmount,
        preferred_partnership_percentages:
          partnershipPercentageInput.trim() !== ""
            ? (() => {
              const n = parseInt(partnershipPercentageInput.replace(/\D/g, ""), 10);
              return Number.isFinite(n) && n >= 0 && n <= 100 ? [n] : undefined;
            })()
            : undefined,
        preferred_category_ids:
          preferredCategoryIds.length > 0 ? preferredCategoryIds : undefined,
        preferred_categories_other:
          otherCategorySelected && preferredCategoriesOther.trim().length > 0
            ? preferredCategoriesOther.trim()
            : undefined,
        preferred_locations:
          preferredLocations.length > 0 ? preferredLocations : undefined,
        preferred_partnership_types:
          preferredPartnershipTypes.length > 0 ? preferredPartnershipTypes : undefined,
        preferred_investment_type: preferredInvestmentType || undefined,
      });
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("profile_updated_successfully"),
      });
      router.replace("/home");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: error.response?.data?.message || t("failed_to_update_profile"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientOverlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentAbove}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.header,
              {
                alignItems: isRTL ? "flex-end" : "flex-start",
                paddingStart: isRTL ? 12 : 12,
                paddingEnd: isRTL ? 16 : 12,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.title,
                {
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                },
              ]}
              numberOfLines={2}
            >
              {t("investor_onboarding")}
            </ThemedText>
            <ThemedText
              style={[
                styles.subtitle,
                {
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                },
              ]}
            >
              {t("tell_us_preferences")}
            </ThemedText>
          </View>

          {/* Q1: Risk tolerance (optional, numbers only) */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_risk_tolerance")} ({t("onboarding_optional")})
            </ThemedText>
            <CustomInput
              label=""
              placeholder={t("onboarding_risk_hint")}
              value={riskTolerance}
              onChangeText={(v) => setRiskTolerance(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Max capital (required) - 1 SAR to selected max */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_capital")} *
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { marginBottom: 8, textAlign: isRTL ? "right" : "left" }]}
            >
              {t("onboarding_capital_hint")}
            </ThemedText>
            <CustomDropdown
              label=""
              placeholder={t("onboarding_no_limit")}
              options={maxInvestmentOptions}
              onSelect={setMaxInvestmentAmount}
              selectedValue={maxInvestmentAmount}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.maxInvestment ? (
              <ThemedText style={{
                color: "#c00", fontSize: 12, marginTop: 4,
                fontFamily: Fonts.CairoRegular, textAlign: isRTL ? "right" : "left"
              }}>
                {errors.maxInvestment}
              </ThemedText>
            ) : null}
          </View>

          {/* Q4: Partnership percentage (optional) - numeric input */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_partnership_pct")} ({t("onboarding_optional")})
            </ThemedText>
            <CustomInput
              label=""
              placeholder={t("onboarding_partnership_pct_placeholder")}
              value={partnershipPercentageInput}
              onChangeText={(v) => setPartnershipPercentageInput(v.replace(/\D/g, "").slice(0, 3))}
              keyboardType="numeric"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Q5: Projects interested - categories + Other (required) */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_projects_interested")} *
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { marginBottom: 8, textAlign: isRTL ? "right" : "left" }]}
            >
              {t("onboarding_choose_categories")}
            </ThemedText>
            {categories.length > 0 && (
              <View
                style={[
                  {
                    flexDirection: isRTL ? "row-reverse" : "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12,
                  },
                ]}
              >
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: preferredCategoryIds.includes(cat.id)
                        ? "#67A3B1"
                        : "#E8E8E8",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        color: preferredCategoryIds.includes(cat.id) ? "#fff" : "#333",
                        fontFamily: Fonts.CairoRegular,
                      }}
                    >
                      {isRTL
                        ? cat.name_ar || cat.localized_name || cat.name
                        : cat.name || cat.localized_name || cat.name_ar}
                    </ThemedText>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setOtherCategorySelected((prev) => {
                      if (!prev) return true;
                      setPreferredCategoriesOther("");
                      return false;
                    });
                    if (errors.preferredCategories) setErrors((e) => ({ ...e, preferredCategories: "" }));
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: otherCategorySelected ? "#67A3B1" : "#E8E8E8",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 13,
                      color: otherCategorySelected ? "#fff" : "#333",
                    }}
                  >
                    {t("onboarding_other")}
                  </ThemedText>
                </Pressable>
              </View>
            )}
            {otherCategorySelected && (
              <CustomInput
                label={t("onboarding_other")}
                placeholder={t("onboarding_other_placeholder")}
                value={preferredCategoriesOther}
                onChangeText={(v) => {
                  setPreferredCategoriesOther(v);
                  if (errors.preferredCategories) setErrors((e) => ({ ...e, preferredCategories: "" }));
                }}
                containerStyle={{ marginBottom: 0 }}
              />
            )}
            {errors.preferredCategories ? (
              <ThemedText style={{
                color: "#c00", fontSize: 12, marginTop: 4,
                fontFamily: Fonts.CairoRegular, textAlign: isRTL ? "right" : "left"
              }}>
                {errors.preferredCategories}
              </ThemedText>
            ) : null}
          </View>

          {/* Q6: Preferred city (optional) - select box */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_preferred_city")} ({t("onboarding_optional")})
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { marginBottom: 8, textAlign: isRTL ? "right" : "left" }]}
            >
              {t("onboarding_cities_or_all")}
            </ThemedText>
            <CustomDropdown
              label=""
              placeholder={t("all")}
              options={cityOptions}
              onSelect={onLocationSelect}
              selectedValue={
                preferredLocations.length === 0 ? "all" : preferredLocations[0]
              }
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Q7: Partnership type (optional, multi) */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_partnership_type")} ({t("onboarding_multi_optional")})
            </ThemedText>
            <View
              style={[
                {
                  flexDirection: isRTL ? "row-reverse" : "row",
                  flexWrap: "wrap",
                  gap: 8,
                },
              ]}
            >
              {PARTNERSHIP_TYPES.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => togglePartnershipType(opt.value)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: preferredPartnershipTypes.includes(opt.value)
                      ? "#67A3B1"
                      : "#E8E8E8",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 13,
                      color: preferredPartnershipTypes.includes(opt.value) ? "#fff" : "#333",
                      fontFamily: Fonts.CairoRegular,
                    }}
                  >
                    {t(opt.labelKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Q8: Preferred investment type (required) */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("onboarding_investment_type")} *
            </ThemedText>
            <CustomDropdown
              label=""
              placeholder={t("onboarding_investment_type")}
              options={investmentTypeOptions}
              onSelect={(v) => {
                setPreferredInvestmentType(v);
                if (errors.preferredInvestmentType)
                  setErrors((e) => ({ ...e, preferredInvestmentType: "" }));
              }}
              selectedValue={preferredInvestmentType}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.preferredInvestmentType ? (
              <ThemedText style={{
                color: "#c00", fontSize: 12, marginTop: 4
                , fontFamily: Fonts.CairoRegular, textAlign: isRTL ? "right" : "left"
              }}>
                {errors.preferredInvestmentType}
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.stickyButtons,
            {
              flexDirection: isRTL ? "row-reverse" : "row",
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 25,
            },
          ]}
        >
          <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isLoading}>
            <ThemedText style={styles.skipButtonText}>{t("skip")}</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.saveButton, isLoading && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                {t("save_and_continue")}
              </ThemedText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
