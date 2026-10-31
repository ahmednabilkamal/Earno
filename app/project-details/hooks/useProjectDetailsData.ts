import { useFocusEffect } from "@react-navigation/native";
import { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { ProjectDetails, projectService } from "@/services/project-service";
import { ProjectReportReason, reportService } from "@/services/report-service";
import { goBackOrHome } from "@/utils/go-back-or-home";
import { isNetworkOrServerError } from "@/utils/network-error";

import {
    asRecord,
    getApiError,
    getErrorMessage,
    pickBoolean,
} from "../utils/api-helpers";

type AuthUserLike = {
  id?: number | string;
  user_type?: string;
} | null | undefined;

type ParamsLike = Record<string, string | string[] | undefined>;

type RouterLike = {
  back: () => void;
  replace: (href: string) => void;
  canGoBack: () => boolean;
};

type UseProjectDetailsDataArgs = {
  params: ParamsLike;
  user: AuthUserLike;
  isAuthenticated: boolean;
  t: TFunction;
  router: RouterLike;
};

const getParamString = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function useProjectDetailsData({
  params,
  user,
  isAuthenticated,
  t,
  router,
}: UseProjectDetailsDataArgs) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [blockedAccess, setBlockedAccess] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showExpressInterestSheet, setShowExpressInterestSheet] = useState(false);
  const [showOwnerOptionsSheet, setShowOwnerOptionsSheet] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] =
    useState<ProjectReportReason>("fake_project");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const hasFocusedOnceRef = useRef(false);

  const projectId = getParamString(params.id);
  const fromFavorites = getParamString(params.fromFavorites);
  const ownProjectParam = getParamString(params.isOwnProject);

  const isProjectOwner = user?.user_type === "project_owner";
  const isInvestor = user?.user_type === "investor";
  const isOwnProjectFromParams =
    ownProjectParam === "1" || ownProjectParam === "true";

  const ownsProject = useMemo(() => {
    if (isOwnProjectFromParams) return true;
    if (projectDetails?.payment?.isOwner) return true;
    if (!user?.id || !projectDetails?.owner?.id) return false;
    return Number(user.id) === Number(projectDetails.owner.id);
  }, [isOwnProjectFromParams, user?.id, projectDetails?.owner?.id, projectDetails?.payment?.isOwner]);

  useEffect(() => {
    let isMounted = true;

    const fetchProjectDetails = async () => {
      if (!projectId) {
        setIsLoading(false);
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("project_not_found"),
        });
        goBackOrHome(router);
        return;
      }

      const minSkeletonMs = 600;
      const startedAt = Date.now();
      try {
        setIsLoading(true);
        setBlockedAccess(false);
        const details = await projectService.getProjectById(
          projectId,
          isProjectOwner,
          isInvestor && isOwnProjectFromParams
        );
        if (isMounted) {
          setProjectDetails(details);
          setNetworkError(false);

          const detailsRecord = asRecord(details);
          const favoriteStatus =
            details.isFavourite ??
            pickBoolean(detailsRecord, [
              "is_favorited",
              "is_favourite",
              "isFavorite",
              "is_favorite",
              "user_has_favorited",
            ]) ??
            false;

          const openedFromFavorites =
            fromFavorites === "1" || fromFavorites === "true";

          setIsFavorite(openedFromFavorites || favoriteStatus);

          const interestStatus =
            pickBoolean(detailsRecord, ["has_interest", "hasInterest"]) ??
            false;
          setHasInterest(interestStatus);
        }
      } catch (error: unknown) {
        console.error("Error fetching project details:", error);
        if (isMounted) {
          setProjectDetails(null);
          const apiError = getApiError(error);
          const status = apiError?.response?.status;
          const errCode = apiError?.response?.data?.error;
          if (status === 403 && errCode === "USER_BLOCKED") {
            setBlockedAccess(true);
            setNetworkError(false);
          } else if (isNetworkOrServerError(error)) {
            setBlockedAccess(false);
            setNetworkError(true);
          } else {
            setBlockedAccess(false);
            Toast.show({
              type: "error",
              text1: t("error"),
              text2: t("failed_to_load_project"),
            });
          }
        }
      } finally {
        if (isMounted) {
          const elapsed = Date.now() - startedAt;
          const waitLeft = Math.max(0, minSkeletonMs - elapsed);
          setTimeout(() => setIsLoading(false), waitLeft);
        }
      }
    };

    fetchProjectDetails();

    return () => {
      isMounted = false;
    };
  }, [
    fromFavorites,
    isInvestor,
    isOwnProjectFromParams,
    isProjectOwner,
    projectId,
    retryTrigger,
    router,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnceRef.current) {
        setRetryTrigger((n) => n + 1);
      } else {
        hasFocusedOnceRef.current = true;
      }
    }, [])
  );

  const handleRetryNetwork = useCallback(() => {
    setNetworkError(false);
    setRetryTrigger((n) => n + 1);
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("please_login_to_favorite"),
      });
      return;
    }

    if (!projectId || isTogglingFavorite) {
      return;
    }

    try {
      setIsTogglingFavorite(true);
      const result = await projectService.toggleFavorite(projectId, isFavorite);

      if (result.success) {
        setIsFavorite(result.isFavorite);
        Toast.show({
          type: "success",
          text1: result.isFavorite
            ? t("added_to_favorites", { defaultValue: "Added to favorites" })
            : t("removed_from_favorites", {
                defaultValue: "Removed from favorites",
              }),
        });

        if (projectDetails) {
          setProjectDetails({
            ...projectDetails,
            stats: {
              ...projectDetails.stats,
              favoritesCount: result.isFavorite
                ? (projectDetails.stats?.favoritesCount || 0) + 1
                : Math.max((projectDetails.stats?.favoritesCount || 0) - 1, 0),
            },
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error toggling favorite:", error);
      const rawMsg = getErrorMessage(error) || "";
      const isUnavailable = rawMsg.toLowerCase().includes("not available") || rawMsg.toLowerCase().includes("favorite");
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: isUnavailable ? t("project_not_available_to_favorite") : rawMsg || t("failed_to_update_favorite"),
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isFavorite, isTogglingFavorite, projectDetails, projectId, t]);

  const submitProjectReport = useCallback(async () => {
    if (reportReason === "other" && !reportDescription.trim()) {
      Toast.show({
        type: "error",
        text1: t("description_required", { defaultValue: "Description required" }),
        text2: t("provide_details_other", {
          defaultValue: "Please provide details for Other reason",
        }),
      });
      return;
    }
    if (!projectDetails?.id) return;
    setReportSubmitting(true);
    try {
      await reportService.createReport({
        report_type: "project",
        reason: reportReason,
        description: reportDescription.trim() || undefined,
        reported_project_id: parseInt(projectDetails.id, 10),
      });
      Toast.show({
        type: "success",
        text1: t("report_submitted", { defaultValue: "Report submitted" }),
        text2: t("report_thank_you", {
          defaultValue: "Thank you. We will review your report.",
        }),
      });
      setReportModalVisible(false);
      setReportDescription("");
      setReportReason("fake_project");
      setProjectDetails((prev) => (prev ? { ...prev, userHasReported: true } : null));
    } catch (error: unknown) {
      Toast.show({
        type: "error",
        text1: t("error", { defaultValue: "Error" }),
        text2:
          getErrorMessage(error) ||
          t("failed_submit_report", { defaultValue: "Failed to submit report" }),
      });
    } finally {
      setReportSubmitting(false);
    }
  }, [projectDetails?.id, reportDescription, reportReason, t]);

  const handleStopProject = useCallback(async () => {
    if (!projectDetails || isStopping) return;
    try {
      setIsStopping(true);
      const result = await projectService.stopProject(projectDetails.id);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: result?.message || t("project_stopped_successfully"),
      });
      goBackOrHome(router);
    } catch (error: unknown) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: getErrorMessage(error) || t("failed_to_stop_project"),
      });
    } finally {
      setIsStopping(false);
    }
  }, [isStopping, projectDetails, router, t]);

  const handleRunAgain = useCallback(async () => {
    if (isResuming || !projectDetails) return;
    try {
      setIsResuming(true);
      const result = await projectService.togglePublication(projectDetails.id);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2:
          result?.message ||
          t("project_run_again_success", {
            defaultValue: "Project is now running again.",
          }),
      });
      setProjectDetails((prev) =>
        prev ? { ...prev, isPublished: result.isPublished } : null
      );
      setShowOwnerOptionsSheet(false);
    } catch (error: unknown) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: getErrorMessage(error) || t("failed_to_run_project"),
      });
    } finally {
      setIsResuming(false);
    }
  }, [isResuming, projectDetails, t]);

  return {
    blockedAccess,
    handleRetryNetwork,
    handleRunAgain,
    handleStopProject,
    handleToggleFavorite,
    hasInterest,
    isFavorite,
    isInvestor,
    isLoading,
    isOwnProjectFromParams,
    isProjectOwner,
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
    setProjectDetails,
    setReportDescription,
    setReportModalVisible,
    setReportReason,
    setShowExpressInterestSheet,
    setShowOwnerOptionsSheet,
    showExpressInterestSheet,
    showOwnerOptionsSheet,
    submitProjectReport,
  };
}
