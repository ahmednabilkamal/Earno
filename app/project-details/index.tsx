import { ImageSlider } from "@/components/ImageSlider";
import { ExpressInterestSheet } from "@/components/ui/express-interest-sheet";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { NetworkErrorScreen } from "@/components/ui/network-error-screen";
import { ProjectDetailsSkeleton } from "@/components/ui/project-details-skeleton";
import { ProjectOwnerOptionsSheet } from "@/components/ui/project-owner-options-sheet";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { API_CONFIG } from "@/constants/api";
import { useAuthStore } from "@/store/auth-store";
import { goBackOrHome } from "@/utils/go-back-or-home";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    BackHandler,
    Linking,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { ReportProjectModal } from "./components/ReportProjectModal";
import { SectionCard } from "./components/SectionCard";
import { useProjectDetailsData } from "./hooks/useProjectDetailsData";
import styles from "./styles";
import { buildProjectSections } from "./utils/section-builders";

export default function ProjectDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBackOrHome(router);
        return true;
      });
      return () => sub.remove();
    }, [router])
  );
  const isRTL = i18n.language.startsWith("ar");
  const { user, isAuthenticated } = useAuthStore();

  const {
    blockedAccess,
    handleRetryNetwork,
    handleRunAgain,
    handleStopProject,
    handleToggleFavorite,
    hasInterest,
    isFavorite,
    isInvestor,
    isLoading,
    isResuming,
    isStopping,
    isTogglingFavorite,
    networkError,
    ownsProject,
    projectDetails,
    reportDescription,
    reportModalVisible,
    reportReason,
    reportSubmitting,
    setHasInterest,
    setReportDescription,
    setReportModalVisible,
    setReportReason,
    setShowExpressInterestSheet,
    setShowOwnerOptionsSheet,
    showExpressInterestSheet,
    showOwnerOptionsSheet,
    submitProjectReport,
  } = useProjectDetailsData({
    params,
    user,
    isAuthenticated,
    t,
    router,
  });

  if (networkError) {
    return (
      <View style={styles.container}>
        <GradientOverlay />
        <NetworkErrorScreen onRetry={handleRetryNetwork} />
      </View>
    );
  }

  if (blockedAccess) {
    return (
      <View style={styles.container}>
        <GradientOverlay />
        <View style={[styles.centerContent, styles.contentAbove, { paddingHorizontal: 24 }]}>
          <Ionicons name="ban-outline" size={52} color={Colors.primary} style={{ marginBottom: 16 }} />
          <Text
            style={[
              styles.errorText,
              { textAlign: "center", marginBottom: 24, paddingHorizontal: 8 },
            ]}
          >
            {t("user_blocked_project", {
              defaultValue:
                "You cannot view this project because of a block between you and the owner.",
            })}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrHome(router)} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>{t("go_back", { defaultValue: "Go back" })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GradientOverlay />
        <ProjectDetailsSkeleton isRTL={isRTL} />
      </View>
    );
  }

  if (!projectDetails) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <GradientOverlay />
        <View style={[styles.centerContent, styles.contentAbove]}>
          <Text style={styles.errorText}>{t("project_not_found")}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={styles.backButtonText}>{t("go_back")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const {
    investmentDetails,
    investorSeekingSections,
    isInvestorSeeking,
    isRealEstate,
    keyFigures,
    projectInfo,
    propertySections,
  } = buildProjectSections({
    projectDetails,
    ownsProject,
    isRTL,
    t,
  });

  const isOwnerContext = ownsProject || projectDetails.payment?.isOwner;
  const shouldShowPayNow =
    projectDetails.payment?.isOwner &&
    (projectDetails.payment?.status === "unpaid" ||
      projectDetails.payment?.status === "voided") &&
    (projectDetails.payment?.fee_required ||
      projectDetails.payment?.amount ||
      projectDetails.payment?.fee_amount);
  const canManagePublication =
    projectDetails.status === "active" &&
    projectDetails.payment?.status === "paid";
  const isInReview =
    projectDetails.status === "under_review" ||
    projectDetails.status === "re_review";

  const openEditProject = () => {
    if (projectDetails.projectType === "investor_seeking") {
      router.push({
        pathname: "/add-investor-project",
        params: { editMode: "true", projectId: projectDetails.id },
      });
    } else {
      router.push({
        pathname: "/add-project",
        params: { editMode: "true", projectId: projectDetails.id },
      });
    }
  };

  const handleShareProject = async () => {
    try {
      // Prefer projectDetails.id (from API), fall back to the route param
      const resolvedId = projectDetails.id || (Array.isArray(params.id) ? params.id[0] : params.id) || "";
      const webBaseUrl = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
      const fallbackShareUrl = resolvedId
        ? `${webBaseUrl}/p/${resolvedId}${projectDetails.slug ? `/${encodeURIComponent(projectDetails.slug)}` : ""}`
        : "";
      const shareUrl = projectDetails.urls?.share || fallbackShareUrl;

      const parts: string[] = [];
      const appNameStr = isRTL 
        ? "راجع هذا المشروع في تطبيق ايرنو - Earno 🚀" 
        : "Check out this project on the Earno app 🚀";
      parts.push(appNameStr);

      if (typeof projectDetails.title === "string" && projectDetails.title.trim()) {
        parts.push(`📋 ${projectDetails.title.trim()}`);
      }

      if (shareUrl && Platform.OS !== "ios") {
        parts.push(`🔗 ${shareUrl}`);
      }

      const shareMessage = parts.join("\n\n");

      await Share.share({
        title: projectDetails.title,
        message: shareMessage,
        url: shareUrl || undefined, // iOS uses this separately
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error", { defaultValue: "Error" }),
        text2: t("failed_to_share_project", {
          defaultValue: "Failed to share project",
        }),
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <GradientOverlay />
      <ScrollView
        style={styles.contentAbove}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ position: "relative" }}>
          <ImageSlider
            isRTL={isRTL}
            images={
              projectDetails.images && Array.isArray(projectDetails.images)
                ? projectDetails.images
                  .filter((img) => img && typeof img === "string" && img.trim().length > 0)
                  .map((img) => {
                    // Handle base64 images - if it's base64, convert to data URI
                    if (typeof img === "string") {
                      // Check if it's already a data URI
                      if (img.startsWith("data:image")) {
                        return img;
                      }
                      // Check if it's base64 without prefix (base64 strings are typically longer)
                      if (!img.startsWith("http") && !img.startsWith("/") && img.length > 50) {
                        // Likely base64, add data URI prefix
                        return `data:image/jpeg;base64,${img}`;
                      }
                      // It's a URL or path, return as is
                      return img;
                    }
                    return img;
                  })
                : []
            }
          />
          <View
            style={[
              styles.headerButtons,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => goBackOrHome(router)}
            >
              <Ionicons
                name={isRTL ? "chevron-forward" : "chevron-back"}
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.headerActions,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => void handleShareProject()}
              >
                <Ionicons
                  name="share-social-outline"
                  size={24}
                  color={Colors.white}
                />
              </TouchableOpacity>

              {!isOwnerContext && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavorite ? Colors.red : Colors.white}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Payment/status alerts for project owner (investor or project_owner) */}
          {projectDetails.payment?.isOwner && ownsProject && (() => {
            const status = projectDetails.status;
            const paymentStatus = projectDetails.payment?.status ?? "";
            if (["paid", "authorized"].includes(paymentStatus) && isInReview) {
              return (
                <View style={[styles.sectionCard, { backgroundColor: "#EFF6FF", borderColor: "#93C5FD", marginBottom: 12 }]}>
                  <Text style={{ color: "#1E40AF", fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                    {status === "re_review"
                      ? t("project_re_review", {
                          defaultValue: isRTL
                            ? "جاري مراجعة مشروعك."
                            : "Your  project is under re-review.",
                        })
                      : t("project_under_review", { defaultValue: "Your project is under review." })}
                  </Text>
                </View>
              );
            }
            if ((paymentStatus === "unpaid" || paymentStatus === "voided") && status === "pending") {
              return (
                <View style={[styles.sectionCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", marginBottom: 12 }]}>
                  <Text style={{ color: "#B91C1C", fontWeight: "600", textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoSemiBold }}>
                    {t("you_have_to_pay", { defaultValue: "You have to pay to publish your project." })}
                  </Text>
                </View>
              );
            }
            if (status === "rejected") {
              return (
                <View style={[styles.sectionCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", marginBottom: 12 }]}>
                  <Text style={{ color: "#B91C1C", fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                    {t("project_rejected", { defaultValue: "Your project has been rejected." })}
                  </Text>
                  {projectDetails.rejectionReason ? (
                    <Text style={{ color: "#991B1B", fontSize: 14, marginTop: 8, textAlign: isRTL ? "right" : "left" }}>
                      {projectDetails.rejectionReason}
                    </Text>
                  ) : null}
                </View>
              );
            }
            return null;
          })()}
          {/* Project is off banner - only when status is active (not under_review) */}
          {projectDetails.payment?.isOwner &&
            ownsProject &&
            projectDetails.status === "active" &&
            projectDetails.payment?.status === "paid" &&
            !projectDetails.isPublished && (
              <View style={[styles.sectionCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B", marginBottom: 12 }]}>
                <Text style={{ color: "#92400E", fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                  {t("project_is_off", { defaultValue: "This project is off. Other users cannot see it." })}
                </Text>
                <Text style={{ color: "#B45309", fontSize: 14, marginTop: 6, textAlign: isRTL ? "right" : "left" }}>
                  {t("project_is_off_hint", { defaultValue: "You can run it again anytime using the green button below." })}
                </Text>
              </View>
            )}
          {isRealEstate
            ? propertySections
              .filter((s): s is typeof s & { details: { label: string; value: string; icon?: unknown }[] } => Boolean(s?.details?.length))
              .map((section, index) => (
                <SectionCard key={index} isRTL={isRTL} {...section} />
              ))
            : isInvestorSeeking
              ? investorSeekingSections
                .filter((s): s is typeof s & { details: { label: string; value: string; icon?: unknown }[] } => Boolean(s?.details?.length))
                .map((section, index) => (
                  <SectionCard key={index} isRTL={isRTL} {...section} />
                ))
              : projectInfo != null && <SectionCard isRTL={isRTL} {...projectInfo} />}
          {investmentDetails.details && investmentDetails.details.length > 0 && (
            <SectionCard isRTL={isRTL} {...investmentDetails} />
          )}
          <SectionCard isRTL={isRTL} {...keyFigures} />

          {projectDetails.description && projectDetails.description.trim() && (
            <View style={styles.sectionCard}>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("description", { defaultValue: "Description" })}
              </Text>
              <Text
                style={[
                  styles.sectionContent,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {projectDetails.description}
              </Text>
            </View>
          )}

          {projectDetails.businessModel &&
            projectDetails.businessModel.trim() && (
              <View style={styles.sectionCard}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("business_model_title", {
                    defaultValue: "Business Model",
                  })}
                </Text>
                <Text
                  style={[
                    styles.sectionContent,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {projectDetails.businessModel}
                </Text>
              </View>
            )}

          {projectDetails.useOfFunds && projectDetails.useOfFunds.trim() && (
            <View style={styles.sectionCard}>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("use_of_funds_title", { defaultValue: "Use of Funds" })}
              </Text>
              <Text
                style={[
                  styles.sectionContent,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {projectDetails.useOfFunds}
              </Text>
            </View>
          )}

          {projectDetails.riskFactors && projectDetails.riskFactors.trim() && (
            <View style={styles.sectionCard}>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("risk_factors_title", { defaultValue: "Risk Factors" })}
              </Text>
              <Text
                style={[
                  styles.sectionContent,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {projectDetails.riskFactors}
              </Text>
            </View>
          )}

          {/* Express Interest - for investors viewing non-own projects */}
          {!ownsProject && isInvestor && (
            <View style={styles.sectionCard}>
              <View
                style={[
                  styles.sectionTitleRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View style={styles.sectionTitleIcon}>
                  <Ionicons name="mail-open" size={20} color={Colors.primary} />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: isRTL ? "right" : "left", marginBottom: 0 },
                  ]}
                >
                  {t("express_interest", { defaultValue: "Express Interest" })}
                </Text>
              </View>
              {hasInterest ? (
                <View style={{ backgroundColor: "#E8F5E9", padding: 16, borderRadius: 12, marginTop: 12 }}>
                  <Text style={{ color: "#2E7D32", fontSize: 14, textAlign: isRTL ? "right" : "left" }}>
                    {t("you_have_already_expressed_interest", {
                      defaultValue: "You have already expressed interest in this project.",
                    })}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.expressInterestButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  onPress={() => {
                    if (!isAuthenticated) {
                      Toast.show({
                        type: "error",
                        text1: t("error"),
                        text2: t("please_login_to_express_interest", {
                          defaultValue: "Please login to express interest",
                        }),
                      });
                      return;
                    }
                    setShowExpressInterestSheet(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-open" size={20} color="#fff" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                  <Text style={styles.expressInterestButtonText}>
                    {t("express_interest", { defaultValue: "Express Interest" })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Report button - last in main section, only when not own project and user hasn't reported */}
          {!ownsProject && !projectDetails.userHasReported && (
            <View style={[styles.sectionCard, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, textAlign: isRTL ? "right" : "left" }]}>
                {t("report_project", { defaultValue: "Report Project" })}
              </Text>
              <TouchableOpacity
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E5E5" }}
                onPress={() => setReportModalVisible(true)}
              >
                <Ionicons name="flag-outline" size={20} color={Colors.primary} />
                <Text style={{ fontSize: 14, color: Colors.primary, fontWeight: "500", fontFamily: Fonts.CairoSemiBold }}>{t("report", { defaultValue: "Report" })}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Express Interest Sheet */}
      {projectDetails && (
        <ExpressInterestSheet
          visible={showExpressInterestSheet}
          onClose={() => setShowExpressInterestSheet(false)}
          projectId={projectDetails.id}
          suggestedAmount={parseFloat(projectDetails.investmentNeeded || projectDetails.funding?.goal || "0") || 1000}
          minInvestment={projectDetails.minInvestment ?? 100}
          maxInvestment={projectDetails.maxInvestment ?? null}
          onSuccess={() => setHasInterest(true)}
        />
      )}

      <ReportProjectModal
        visible={reportModalVisible}
        isRTL={isRTL}
        reportReason={reportReason}
        reportDescription={reportDescription}
        reportSubmitting={reportSubmitting}
        onClose={() => setReportModalVisible(false)}
        onSubmit={submitProjectReport}
        onReasonChange={setReportReason}
        onDescriptionChange={setReportDescription}
      />

      {/* Project Owner Options Sheet */}
      {projectDetails && (
        <ProjectOwnerOptionsSheet
          visible={showOwnerOptionsSheet}
          onClose={() => setShowOwnerOptionsSheet(false)}
          onViewInterests={() => {
            router.push({
              pathname: "/project-interests/[projectId]" as const,
              params: {
                projectId: projectDetails.id,
                projectTitle: projectDetails.title || "",
              },
            });
          }}
          onEditProject={() => {
            openEditProject();
          }}
          onStopProject={handleStopProject}
          onRunAgain={handleRunAgain}
          isPublished={projectDetails.isPublished}
          isUnderReview={isInReview}
          canManagePublication={canManagePublication}
          isStopping={isStopping}
          isResuming={isResuming}
        />
      )}

      <View style={styles.bottomButtonContainer}>
        {/* If own project and payment is PAID or AUTHORIZED -> show owner controls (interests, edit, suspend/active) for all project types */}
        {isOwnerContext ? (
          !shouldShowPayNow ? (
            <TouchableOpacity
              style={[styles.settingsButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              activeOpacity={0.8}
              onPress={() => setShowOwnerOptionsSheet(true)}
            >
              <Ionicons
                name="settings"
                size={22}
                color={Colors.primary}
                style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
              />
              <Text style={styles.settingsButtonText}>
                {t("settings", { defaultValue: "Settings" })}
              </Text>
            </TouchableOpacity>
          ) : null
        ) : (
          // If NOT own project -> show Chat and optionally WhatsApp (never show for own project)
          !ownsProject && !projectDetails.payment?.isOwner && (
            <View style={[styles.contactButtonsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TouchableOpacity
                style={[styles.contactButton, styles.chatButton]}
                activeOpacity={0.8}
                onPress={() => {
                  const ownerId = projectDetails?.owner?.id;
                  if (!ownerId) {
                    Toast.show({
                      type: "error",
                      text1: t("error"),
                      text2: t("owner_contact_not_available", {
                        defaultValue: "Owner contact is not available",
                      }),
                    });
                    return;
                  }
                  router.push({
                    pathname: "/chat",
                    params: {
                      otherUserId: String(ownerId),
                      otherUserName: projectDetails?.owner?.name || projectDetails?.owner?.company || "Owner",
                      projectId: projectDetails.id,
                      projectTitle: projectDetails.title || "",
                    },
                  });
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                <Text style={[styles.contactButtonText, { marginHorizontal: 6 }]}>
                  {t("chat", { defaultValue: "Chat" })}
                </Text>
              </TouchableOpacity>
              {projectDetails?.owner?.phone ? (
                <TouchableOpacity
                  style={[styles.contactButton, styles.whatsappButton]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    try {
                      const ownerPhone = projectDetails?.owner?.phone || "";
                      const digitsOnly = ownerPhone.replace(/[^0-9]/g, "");
                      const normalizedPhone = digitsOnly.startsWith("966")
                        ? digitsOnly
                        : digitsOnly.startsWith("0")
                          ? `966${digitsOnly.slice(1)}`
                          : digitsOnly.length === 9
                            ? `966${digitsOnly}`
                            : digitsOnly;
                      if (!normalizedPhone) {
                        Toast.show({
                          type: "error",
                          text1: t("error"),
                          text2: t("owner_contact_not_available", {
                            defaultValue: "Owner contact is not available",
                          }),
                        });
                        return;
                      }
                      const message = t("whatsapp_default_message", {
                        defaultValue: "Hello, I'm interested in your project on Earno.",
                      });
                      const textParam = encodeURIComponent(message);
                      const waMeUrl = `https://wa.me/${normalizedPhone}?text=${textParam}`;
                      const whatsappAppUrl = `whatsapp://send?phone=${normalizedPhone}&text=${textParam}`;
                      try {
                        await Linking.openURL(waMeUrl);
                      } catch {
                        await Linking.openURL(whatsappAppUrl);
                      }
                    } catch (error) {
                      console.error("Failed to open WhatsApp:", error);
                      Toast.show({ type: "error", text1: t("error"), text2: t("failed_to_open_whatsapp", { defaultValue: "Failed to open WhatsApp" }) });
                    }
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
                  <Text style={[styles.contactButtonText, { marginHorizontal: 6 }]}>{t('WhatsApp')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        )}

        {/* If owner and payment is UNPAID or VOIDED -> info + Pay button */}
        {shouldShowPayNow && (
            <View>
              <View style={styles.payInfoBox}>
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <Ionicons name="information-circle" size={22} color="#1D4ED8" />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.payInfoTitle,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {t("pay_to_publish_info_title", {
                        defaultValue: "Publication fee required",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.payInfoBody,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {t("pay_to_publish_info_body", {
                        defaultValue:
                          "Pay the publication fee to submit your project for review. Once approved, it will be visible to investors on Earno.",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.ownerButtonsContainer,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <TouchableOpacity
                  style={styles.payButton}
                  disabled={
                    !projectDetails.payment?.amount &&
                    !projectDetails.payment?.fee_amount
                  }
                  activeOpacity={0.8}
                  onPress={() => {
                    const payment = projectDetails.payment!;
                    const amount = payment.fee_amount ?? payment.amount ?? 0;
                    router.push({
                      pathname: "/payment",
                      params: {
                        amount: String(amount),
                        currency: payment.currency ?? "SAR",
                        description: t("payment", { defaultValue: "Payment" }),
                        projectId: projectDetails.id,
                        paymentType: "project_publication",
                      },
                    });
                  }}
                >
                  <Text style={styles.payButtonText}>
                    {t("pay_now", { defaultValue: "ادفع الآن" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editProjectButton,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                  activeOpacity={0.8}
                  onPress={openEditProject}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={Colors.primary}
                    style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
                  />
                  <Text style={styles.editProjectButtonText}>
                    {t("edit_project", { defaultValue: "تعديل المشروع" })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
      </View>
    </View>
  );
}
