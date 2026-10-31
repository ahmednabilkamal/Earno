import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import {
  CreateTransactionRequest,
  createTransaction,
} from "@/services/payment-api-service";
import {
  createHostedExistingIntent,
  createHostedPendingIntent,
  fetchHostedInvoiceStatus,
  HostedInvoiceIntentResponse,
  HostedInvoicePayment,
} from "@/services/payment-service";
import type { CreateProjectRequest } from "@/services/project-service";
import { projectService } from "@/services/project-service";
import { usePendingProjectStore } from "@/store/pending-project-store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";

export const options = {
  headerShown: false,
};

const ALLOWED_TRANSACTION_TYPES = new Set([
  "investment",
  "commission",
  "payout",
  "refund",
  "fee",
  "project_publication",
]);

function normalizeTransactionType(typeValue?: string): string {
  const value = (typeValue || "").trim();
  if (!value) return "fee";
  return ALLOWED_TRANSACTION_TYPES.has(value) ? value : "fee";
}

export default function PaymentCheckoutScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const langCode = (i18n.resolvedLanguage ?? i18n.language ?? "").toLowerCase();
  const isRTL = langCode.startsWith("ar");

  const [hostedIntent, setHostedIntent] =
    useState<HostedInvoiceIntentResponse | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isVerifyingInvoice, setIsVerifyingInvoice] = useState(false);
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);

  const amountParam = params.amount ? String(params.amount) : "0";
  const amount = parseInt(amountParam, 10) || 0;
  const originalAmountParam = params.originalAmount
    ? String(params.originalAmount)
    : undefined;
  const originalAmount = originalAmountParam
    ? parseFloat(originalAmountParam)
    : undefined;
  const currency = (params.currency as string) || "SAR";
  const description = (params.description as string) || t("payment", { defaultValue: "Payment" });
  const projectIdParam = params.projectId ? String(params.projectId) : undefined;
  const paymentType = (params.paymentType as string) || "project_publication";
  const couponIdParam = params.couponId ? String(params.couponId) : undefined;
  const discountAmountParam = params.discountAmount ? String(params.discountAmount) : undefined;
  const couponId = couponIdParam ? parseInt(couponIdParam, 10) : undefined;
  const discountAmount = discountAmountParam ? parseFloat(discountAmountParam) : undefined;

  const appliedCoupon = useMemo(() => {
    if (couponId != null && !Number.isNaN(couponId) && discountAmount != null && !Number.isNaN(discountAmount)) {
      return { coupon_id: couponId, discount_amount: discountAmount };
    }
    return null;
  }, [couponId, discountAmount]);

  const metadata = useMemo(() => {
    const meta: Record<string, any> = { type: paymentType };
    if (projectIdParam) meta.project_id = projectIdParam;
    if (params.orderId) meta.order_id = params.orderId;
    if (params.userId) meta.user_id = params.userId;
    if (appliedCoupon?.coupon_id != null) meta.coupon_id = appliedCoupon.coupon_id;
    if (appliedCoupon?.discount_amount != null) meta.discount_amount = appliedCoupon.discount_amount;
    return meta;
  }, [appliedCoupon, paymentType, projectIdParam, params.orderId, params.userId]);

  const amountMajor = amount / 100;

  const navigateToSuccess = (projectId: string) => {
    const isOwner = paymentType === "project_publication";
    router.replace({
      pathname: "/payment/success",
      params: { projectId, isOwnProject: isOwner ? "1" : "0" },
    });
  };

  const recordTransactionAndSuccess = async (
    response: Pick<
      HostedInvoicePayment,
      "id" | "status" | "amount" | "fee" | "currency" | "description" | "metadata" | "source"
    >,
  ) => {
    const projectIdValue = response.metadata?.project_id ?? projectIdParam;
    const projectIdNumber = parseInt(String(projectIdValue ?? 0), 10);
    const pending = usePendingProjectStore.getState().getPendingProject();

    if ((!projectIdNumber || Number.isNaN(projectIdNumber)) && pending?.projectData) {
      const amountHalalas = Number(response.amount ?? 0);
      const feeHalalas = Number(response.fee ?? 0);
      const paymentData = {
        transaction_id: response.id,
        amount: amountHalalas / 100,
        fee: feeHalalas / 100,
        currency: response.currency ?? "SAR",
        status: String(response.status),
        payment_method: String(response.source?.type ?? "unknown"),
        payment_gateway: "moyasar",
        notes: response.description ?? description,
        coupon_id: appliedCoupon?.coupon_id ?? null,
        discount_amount: appliedCoupon?.discount_amount ?? null,
      };
      try {
        if (pending.projectType === "investor_seeking") {
          // Investor-seeking projects cannot use owner-only create-with-payment endpoint.
          const result = await projectService.createInvestorProject(
            pending.projectData as any,
          );
          const createdProjectId = result.project?.id ?? result.data?.id;
          if (!createdProjectId) {
            throw new Error("Investor project creation failed after payment");
          }

          await createTransaction({
            project_id: parseInt(String(createdProjectId), 10),
            transaction_id: paymentData.transaction_id,
            type: "fee",
            amount: paymentData.amount,
            fee: paymentData.fee,
            currency: paymentData.currency,
            status: paymentData.status,
            payment_method: paymentData.payment_method,
            payment_gateway: "moyasar",
            notes: paymentData.notes,
            coupon_id: paymentData.coupon_id,
            discount_amount: paymentData.discount_amount,
          });

          usePendingProjectStore.getState().clearPendingProject();
          navigateToSuccess(String(createdProjectId));
        } else {
          const result = await projectService.createProjectWithPayment(
            pending.projectData as unknown as CreateProjectRequest,
            paymentData,
          );
          usePendingProjectStore.getState().clearPendingProject();
          const createdProjectId = result.project?.id ?? result.data?.id;
          if (createdProjectId) {
            navigateToSuccess(String(createdProjectId));
          } else {
            router.replace("/(tabs)/home");
          }
        }
      } catch (error) {
        console.error("Failed to create project with payment:", error);
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("transaction_record_failed", {
            defaultValue: "Payment succeeded but we could not complete. Please contact support.",
          }),
        });
        router.replace("/(tabs)/home");
      }
      return;
    }

    if (!projectIdNumber || Number.isNaN(projectIdNumber)) {
      router.replace("/(tabs)/home");
      return;
    }

    const amountHalalas = Number(response.amount ?? 0);
    const feeHalalas = Number(response.fee ?? 0);
    const payload: CreateTransactionRequest = {
      project_id: projectIdNumber,
      transaction_id: response.id,
      type: normalizeTransactionType(String(response.metadata?.type ?? paymentType)),
      amount: amountHalalas / 100,
      fee: feeHalalas / 100,
      currency: response.currency ?? "SAR",
      status: String(response.status),
      payment_method: String(response.source?.type ?? "unknown"),
      payment_gateway: "moyasar",
      notes: response.description ?? description,
    };
    if (appliedCoupon) {
      payload.coupon_id = appliedCoupon.coupon_id;
      payload.discount_amount = appliedCoupon.discount_amount;
    }

    try {
      await createTransaction(payload);
      navigateToSuccess(String(projectIdNumber));
    } catch (error) {
      console.error("Failed to record transaction:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("transaction_record_failed", {
          defaultValue: "Payment succeeded but we could not record the transaction. Please contact support.",
        }),
      });
      router.replace("/(tabs)/home");
    }
  };

  const startHostedPayment = useCallback(async () => {
    setIntentLoading(true);
    setIntentError(null);
    try {
      const intent = projectIdParam
        ? await createHostedExistingIntent(parseInt(projectIdParam, 10), {
            amount: amountMajor,
            coupon_id: appliedCoupon?.coupon_id,
            discount_amount: appliedCoupon?.discount_amount,
          })
        : await createHostedPendingIntent({
            amount: amountMajor,
            original_amount: originalAmount,
            coupon_id: appliedCoupon?.coupon_id,
            discount_amount: appliedCoupon?.discount_amount,
            currency,
            description,
            metadata,
          });
      setHostedIntent(intent);
    } catch (error: any) {
      setIntentError(
        error?.response?.data?.message ||
          t("payment_start_failed", {
            defaultValue: "Could not start payment. Please try again.",
          })
      );
    } finally {
      setIntentLoading(false);
    }
  }, [amountMajor, appliedCoupon, currency, description, metadata, originalAmount, projectIdParam, t]);

  useEffect(() => {
    if (autoStartAttempted || hostedIntent || intentLoading) return;
    setAutoStartAttempted(true);
    void startHostedPayment();
  }, [autoStartAttempted, hostedIntent, intentLoading, startHostedPayment]);

  const finalizeHostedInvoice = async () => {
    if (!hostedIntent || isVerifyingInvoice) return;
    setIsVerifyingInvoice(true);
    try {
      const status = await fetchHostedInvoiceStatus(hostedIntent.invoice_id);
      const payment = status.payment;
      if (!payment) {
        Toast.show({
          type: "error",
          text1: t("payment_failed", { defaultValue: "Payment Failed" }),
          text2: t("payment_unsuccessful", {
            defaultValue: "Your payment was unsuccessful. Please try again.",
          }),
        });
        setHostedIntent(null);

        return;
      }

      if (payment.status === "paid") {
        Toast.show({
          type: "success",
          text1: t("payment_successful"),
          text2: t("payment_completed"),
        });
        await recordTransactionAndSuccess(payment);
      } else if (payment.status === "authorized") {
        Toast.show({
          type: "info",
          text1: t("payment_authorized", { defaultValue: "Payment Authorized" }),
          text2: t("payment_authorized_message", {
            defaultValue: "Payment has been authorized and is pending capture.",
          }),
        });
        await recordTransactionAndSuccess(payment);
      } else {
        Toast.show({
          type: "error",
          text1: t("payment_failed"),
          text2: t("payment_unsuccessful"),
        });
        setHostedIntent(null);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          error?.response?.data?.message ||
          t("something_went_wrong", { defaultValue: "Something went wrong." }),
      });
      setHostedIntent(null);
    } finally {
      setIsVerifyingInvoice(false);
    }
  };

  const handleHostedNavigation = (url: string) => {
    if (!hostedIntent) return;
    const next = (url || "").split("?")[0];
    const success = hostedIntent.success_url.split("?")[0];
    const back = hostedIntent.back_url.split("?")[0];
    if (next.startsWith(success)) {
      void finalizeHostedInvoice();
    } else if (next.startsWith(back)) {
      setHostedIntent(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          >
            <Text style={styles.headerTitle}>
              {t("payment")}
            </Text>
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24}
              color={Colors.text.primary}
            />

          </TouchableOpacity>
        </View>

        <View style={styles.scrollContent}>
          {hostedIntent ? (
            <View style={styles.webViewContainer}>
              <WebView
                source={{ uri: hostedIntent.invoice_url }}
                onNavigationStateChange={(state) => {
                  if (state.url) handleHostedNavigation(state.url);
                }}
                startInLoadingState
              />
              {isVerifyingInvoice && (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.verifyingText}>
                    {t("processing_payment", {
                      defaultValue: "Processing payment...",
                    })}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.intentCard}>
              {intentLoading && !intentError ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    {t("please_wait", { defaultValue: "Please wait" })}
                  </Text>
                </View>
              ) : null}

              {intentError ? (
                <>
                  <Text
                    style={[
                      styles.configError,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {intentError}
                  </Text>
                  <TouchableOpacity
                    style={[styles.payButton, intentLoading && styles.payButtonDisabled]}
                    disabled={intentLoading}
                    onPress={startHostedPayment}
                  >
                    {intentLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.payButtonText}>
                        {t("retry", { defaultValue: "Retry" })}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          )}
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
    width: 44,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  webViewContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  verifyingText: {
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.primary,
    fontSize: 15,
  },
  intentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
    padding: 16,
    minHeight: 180,
    justifyContent: "center",
  },
  intentTitle: {
    fontFamily: Fonts.CairoBold,
    fontSize: 18,
    color: Colors.secondary,
    marginBottom: 8,
  },
  intentDescription: {
    fontFamily: Fonts.CairoRegular,
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  intentAmount: {
    fontFamily: Fonts.CairoBold,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  payButton: {
    borderRadius: 10,
    backgroundColor: Colors.primary,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontFamily: Fonts.CairoBold,
    fontSize: 16,
    color: Colors.white,
  },
  configError: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: Fonts.CairoRegular,
    color: Colors.error,
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.CairoRegular,
    fontSize: 15,
    color: Colors.text.secondary,
  },
});
