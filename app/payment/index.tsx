import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import {
  createTransaction,
  type CreateTransactionRequest,
} from "@/services/payment-api-service";
import { validateCoupon } from "@/services/coupon-service";
import {
  convertToSmallestUnit,
  completeFreeExistingPayment as completeFreeExistingPaymentViaHosted,
} from "@/services/payment-service";
import {
  projectService,
  type CreateProjectRequest,
} from "@/services/project-service";
import { usePendingProjectStore } from "@/store/pending-project-store";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export const options = {
  headerShown: false,
};

export default function PaymentScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";

  const projectIdParam = params.projectId ? String(params.projectId) : undefined;
  const paymentType =
    (params.paymentType as string) || "project_publication";
  const isPendingProject = params.pendingProject === "1";

  // For project publication: prefer fee from backend; fetch if we have projectId OR pending project
  const [fetchedFeeSAR, setFetchedFeeSAR] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentType !== "project_publication" || feeLoading) return;
    // Case 1: we have projectId – fetch fee from project
    if (projectIdParam) {
      let cancelled = false;
      setFeeLoading(true);
      setFeeError(null);
      projectService
        .getProjectById(projectIdParam, true)
        .then((project) => {
          if (cancelled) return;
          const fee =
            project.payment?.fee_amount ?? project.payment?.amount;
          if (typeof fee === "number" && fee >= 0) {
            setFetchedFeeSAR(fee);
          } else {
            setFeeError(
              t("network_error_message", {
                defaultValue:
                  "Please check your internet connection or try again later. The server may be temporarily unavailable.",
              }),
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFetchedFeeSAR(null);
            setFeeError(
              t("network_error_message", {
                defaultValue:
                  "Please check your internet connection or try again later. The server may be temporarily unavailable.",
              }),
            );
          }
        })
        .finally(() => {
          if (!cancelled) setFeeLoading(false);
        });
      return () => { cancelled = true; };
    }
    // Case 2: no projectId but pending project – fetch fee by project type
    if (isPendingProject) {
      const pending = usePendingProjectStore.getState().getPendingProject();
      if (pending?.projectType) {
        let cancelled = false;
        setFeeLoading(true);
        setFeeError(null);
        projectService
          .getPublicationFee(pending.projectType)
          .then((fee) => {
            if (!cancelled && typeof fee === "number" && fee >= 0) {
              setFetchedFeeSAR(fee);
            } else if (!cancelled) {
              setFeeError(
                t("network_error_message", {
                  defaultValue:
                    "Please check your internet connection or try again later. The server may be temporarily unavailable.",
                }),
              );
            }
          })
          .catch(() => {
            if (!cancelled) {
              setFetchedFeeSAR(null);
              setFeeError(
                t("network_error_message", {
                  defaultValue:
                    "Please check your internet connection or try again later. The server may be temporarily unavailable.",
                }),
              );
            }
          })
          .finally(() => {
            if (!cancelled) setFeeLoading(false);
          });
        return () => { cancelled = true; };
      }
    }
  }, [projectIdParam, paymentType, isPendingProject]);

  // For project_publication: use only backend fee. Never use amount from URL.
  const baseAmountSAR = useMemo(() => {
    if (paymentType === "project_publication" && (projectIdParam || isPendingProject)) {
      return fetchedFeeSAR ?? 0;
    }
    if (params.amount) {
      return parseFloat(params.amount as string);
    }
    return 0;
  }, [paymentType, projectIdParam, isPendingProject, fetchedFeeSAR, params.amount]);

  const publicationFeeReady =
    paymentType !== "project_publication" ||
    (!feeLoading && fetchedFeeSAR != null && fetchedFeeSAR >= 0);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: number;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const payAmountSAR = appliedCoupon
    ? appliedCoupon.final_amount
    : baseAmountSAR;
  const amount = useMemo(
    () => convertToSmallestUnit(payAmountSAR),
    [payAmountSAR]
  );

  const currency = (params.currency as string) || "SAR";
  const description = t("payment", { defaultValue: "Payment" });

  const navigateToSuccess = (projectId: string) => {
    router.replace({
      pathname: "/payment/success",
      params: { projectId, isOwnProject: paymentType === "project_publication" ? "1" : "0" },
    });
  };

  const createFreeTransactionId = (seed: string) => `FREE-${seed}-${Date.now()}`;
  const legacyCompatibleFreePaymentMethod = "unknown";
  const successReviewMessage = t("project_submitted_for_review");

  const getRequestErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    t("something_went_wrong");

  const isMissingFreeCompletionRoute = (error: any) => {
    const status = error?.response?.status;
    const message = String(
      error?.response?.data?.message || error?.message || "",
    ).toLowerCase();

    return (
      status === 404 ||
      message.includes("route") ||
      message.includes("not found")
    );
  };

  const handleCompleteFreePayment = async () => {
    if (paymentType !== "project_publication") {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("payment_start_failed"),
      });
      return;
    }

    const couponId = appliedCoupon?.coupon_id ?? null;
    const discountAmount = appliedCoupon?.discount_amount ?? null;
    const freeNotes = t("discount_covers_publication_fee");

    try {
      if (isPendingProject) {
        const pending = usePendingProjectStore.getState().getPendingProject();
        if (!pending?.projectData) {
          throw new Error(t("pending_project_data_not_found"));
        }

        if (pending.projectType === "investor_seeking") {
          const result = await projectService.createInvestorProject(
            pending.projectData as any,
          );
          const createdProjectId = result.project?.id ?? result.data?.id;
          if (!createdProjectId) {
            throw new Error(t("investor_project_creation_failed"));
          }

          const transactionPayload: CreateTransactionRequest = {
            project_id: parseInt(String(createdProjectId), 10),
            transaction_id: createFreeTransactionId(String(createdProjectId)),
            type: "fee",
            amount: baseAmountSAR,
            fee: 0,
            net_amount: 0,
            currency,
            status: "paid",
            payment_method: legacyCompatibleFreePaymentMethod,
            payment_gateway: "internal",
            notes: freeNotes,
            coupon_id: couponId,
            discount_amount: discountAmount,
          };

          await createTransaction(transactionPayload);
          usePendingProjectStore.getState().clearPendingProject();
          Toast.show({
            type: "success",
            text1: t("coupon_applied"),
            text2: successReviewMessage,
          });
          navigateToSuccess(String(createdProjectId));
          return;
        }

        const paymentData = {
          transaction_id: createFreeTransactionId(String(Date.now())),
          amount: baseAmountSAR,
          fee: 0,
          net_amount: 0,
          currency,
          status: "paid",
          payment_method: legacyCompatibleFreePaymentMethod,
          payment_gateway: "internal",
          notes: freeNotes,
          coupon_id: couponId,
          discount_amount: discountAmount,
        };

        const result = await projectService.createProjectWithPayment(
          pending.projectData as CreateProjectRequest,
          paymentData,
        );
        const createdProjectId = result.project?.id ?? result.data?.id;
        usePendingProjectStore.getState().clearPendingProject();
        Toast.show({
          type: "success",
          text1: t("coupon_applied"),
          text2: successReviewMessage,
        });
        if (createdProjectId) {
          navigateToSuccess(String(createdProjectId));
        } else {
          router.replace("/(tabs)/home");
        }
        return;
      }

      if (!projectIdParam) {
        throw new Error(t("project_id_not_found"));
      }

      try {
        await completeFreeExistingPaymentViaHosted({
          projectId: parseInt(projectIdParam, 10),
          coupon_id: couponId,
          discount_amount: discountAmount,
        });
      } catch (error: any) {
        if (!isMissingFreeCompletionRoute(error)) {
          throw error;
        }

        const transactionPayload: CreateTransactionRequest = {
          project_id: parseInt(projectIdParam, 10),
          transaction_id: createFreeTransactionId(projectIdParam),
          type: "fee",
          amount: baseAmountSAR,
          fee: 0,
          net_amount: 0,
          currency,
          status: "paid",
          payment_method: legacyCompatibleFreePaymentMethod,
          payment_gateway: "internal",
          notes: freeNotes,
          coupon_id: couponId,
          discount_amount: discountAmount,
        };

        await createTransaction(transactionPayload);
      }

      Toast.show({
        type: "success",
        text1: t("coupon_applied"),
        text2: successReviewMessage,
      });
      navigateToSuccess(projectIdParam);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: getRequestErrorMessage(error),
      });
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code, baseAmountSAR, "fee");
      if (result.valid && result.coupon_id != null) {
        setAppliedCoupon({
          coupon_id: result.coupon_id,
          discount_amount: result.discount_amount,
          final_amount: result.final_amount,
        });
        Toast.show({
          type: "success",
          text1: t("coupon_applied"),
          text2: result.message,
        });
      } else {
        setCouponError(result.message || t("invalid_coupon"));
      }
    } catch {
      setCouponError(t("something_went_wrong", { defaultValue: "Something went wrong. Please try again." }));
    } finally {
      setCouponLoading(false);
    }
  };

  const amountFormatted = payAmountSAR.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const renderCurrencyAmount = (
    value: string,
    textStyle: StyleProp<TextStyle>,
    iconSize = 16,
    tintColor?: string,
  ) => {
    const resolvedTextStyle = StyleSheet.flatten(textStyle);
    const resolvedTintColor = tintColor ?? resolvedTextStyle?.color ?? Colors.primary;

    return (
      <View style={styles.currencyRow}>
        <View
          style={[
            styles.currencySymbolWrapper,
            { width: iconSize + 3, height: iconSize + 3 },
          ]}
        >
          <Image
            source={require("@/assets/images/real_currency.png")}
            style={[
              styles.currencySymbol,
              { width: iconSize, height: iconSize },
              { tintColor: resolvedTintColor },
            ]}
            resizeMode="contain"
          />
        </View>
        <Text style={[textStyle, styles.currencyValueText]}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.contentAbove, isRTL && styles.contentAboveRTL]}>
        <View
          style={[
            styles.header,
            { flexDirection: "row" },
          ]}
        >
          <TouchableOpacity
            style={[styles.backButton, { flexDirection: "row-reverse" }]}
            onPress={() => router.back()}
            accessibilityLabel={t("payment_methods")}
          >
            <Text style={styles.headerTitle}>
              {t("payment_methods")}
            </Text>
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24}
              color={Colors.text.primary}
            />

          </TouchableOpacity>
        </View>

        <View style={styles.scrollContent}>
          {/* Order summary card */}
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { textAlign: "left" }]}>
              {t("payment_summary")}
            </Text>

            {feeLoading && paymentType === "project_publication" && (projectIdParam || isPendingProject) ? (
              <View style={styles.feeLoadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.feeLoadingText}>{t("loading_fee")}</Text>
              </View>
            ) : (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t("amount_due")}</Text>
                {renderCurrencyAmount(amountFormatted, styles.amountValue, 18)}
              </View>
            )}
          </View>

          {/* Coupon card */}
          <View style={styles.couponCard}>
            {!appliedCoupon ? (
              <>
                <Text style={[styles.couponLabel, { textAlign: "left" }]}>
                  {t("coupon_code")}
                </Text>
                <View style={[styles.couponRow, isRTL && styles.couponRowRTL]}>
                  <TouchableOpacity
                    style={[styles.couponButton, couponLoading && styles.couponButtonDisabled]}
                    onPress={handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.couponButtonText}>{t("apply_coupon")}</Text>
                    )}
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.couponInput, { textAlign: isRTL ? "right" : "left" }]}
                    value={couponCode}
                    onChangeText={(text) => {
                      setCouponCode(text);
                      setCouponError(null);
                    }}
                    placeholder={t("enter_coupon_code")}
                    placeholderTextColor={Colors.inputPlaceholder}
                    editable={!couponLoading}
                    {...withoutCredentialAutofill()}
                  />

                </View>
                {couponError ? (
                  <Text style={styles.couponError}>{couponError}</Text>
                ) : null}
              </>
            ) : (
              <View style={[styles.couponAppliedRow, isRTL && styles.couponAppliedRowRTL]}>
                <View style={styles.couponAppliedAmountRow}>
                  <Text style={styles.couponAppliedText}>{t("discount_applied")}: </Text>
                  {renderCurrencyAmount(
                    `-${appliedCoupon.discount_amount.toFixed(2)}`,
                    styles.couponAppliedText,
                    14,
                    Colors.success
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setAppliedCoupon(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeCouponText}>{t("remove_coupon")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!feeLoading && feeError && paymentType === "project_publication" ? (
            <Text style={styles.couponError}>{feeError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.proceedPayButton,
              (!publicationFeeReady || !!feeError) && styles.proceedPayButtonDisabled,
            ]}
            onPress={() => {
              if (payAmountSAR <= 0) {
                void handleCompleteFreePayment();
                return;
              }

              router.push({
                pathname: "/payment/checkout",
                params: {
                  amount: String(amount),
                  originalAmount: String(baseAmountSAR),
                  currency,
                  description,
                  paymentType,
                  ...(projectIdParam ? { projectId: projectIdParam } : {}),
                  ...(isPendingProject ? { pendingProject: "1" } : {}),
                  ...(params.orderId ? { orderId: String(params.orderId) } : {}),
                  ...(params.userId ? { userId: String(params.userId) } : {}),
                  ...(appliedCoupon ? { couponId: String(appliedCoupon.coupon_id), discountAmount: String(appliedCoupon.discount_amount) } : {}),
                },
              });
            }}
            activeOpacity={0.8}
            disabled={!publicationFeeReady || !!feeError}
          >
            <View style={[styles.proceedPayButtonContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={styles.proceedPayButtonText}>{t("pay_now", { defaultValue: "Pay" })}</Text>
              {renderCurrencyAmount(amountFormatted, styles.proceedPayButtonText, 16, Colors.white)}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
  },
  contentAboveRTL: {
    direction: "rtl",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    // alignItems: "center",
  },
  backButton: {
    height: 40,
    alignItems: "center",
    // justifyContent: "flex-end" as const,
    columnGap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    fontFamily: Fonts.CairoBold,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.secondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLabel: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.primary,
  },
  amountValue: {
    fontSize: 22,
    fontFamily: Fonts.CairoBold,
    color: Colors.primary,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    direction: "ltr",
  },
  currencySymbolWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyValueText: {
    direction: "ltr",
    writingDirection: "ltr",
  },
  currencySymbol: {
    width: 16,
    height: 16,
  },
  currencySymbolBoldLayer: {
    position: "absolute",
    left: 0.6,
    top: 0.2,
    opacity: 0.95,
  },
  couponCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  couponLabel: {
    fontSize: 14,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.primary,
    marginVertical: 12,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  couponRowRTL: {
    flexDirection: "row-reverse",
  },
  couponInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Fonts.CairoSemiBold,
  },
  couponButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  couponButtonDisabled: {
    opacity: 0.7,
  },
  couponButtonText: {
    color: "#fff",
    fontFamily: Fonts.CairoSemiBold,
    fontSize: 15,
  },
  couponError: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.red,
    fontFamily: Fonts.CairoRegular,
  },
  couponAppliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  couponAppliedRowRTL: {
    flexDirection: "row-reverse",
  },
  couponAppliedText: {
    fontSize: 15,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.success,
  },
  couponAppliedAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  removeCouponText: {
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: "underline",
    fontFamily: Fonts.CairoSemiBold,
  },
  feeLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  feeLoadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Fonts.CairoRegular,
  },
  proceedPayButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedPayButtonText: {
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: "#fff",
  },
  proceedPayButtonContent: {
    alignItems: "center",
    gap: 8,
  },
  proceedPayButtonDisabled: {
    opacity: 0.7,
  },
});
