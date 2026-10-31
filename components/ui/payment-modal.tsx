import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal-amount";
import {
  createTransaction,
  type CreateTransactionRequest,
} from "@/services/payment-api-service";
import {
  createHostedExistingIntent,
  fetchHostedInvoiceStatus,
  HostedInvoiceIntentResponse,
  HostedInvoicePayment,
} from "@/services/payment-service";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";

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

interface PaymentModalProps {
  visible: boolean;
  amount: number; // Amount in smallest currency unit (e.g., 20000 = 200.00 SAR)
  projectId: string;
  /** Called on success; receives projectId so parent can navigate to success screen or project details */
  onPaymentSuccess: (projectId?: string) => void;
  onPaymentCancel: () => void;
  currency?: string;
  description?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  amount,
  projectId,
  onPaymentSuccess,
  onPaymentCancel,
  currency = "SAR",
  description = "Project Publication Fee",
}) => {
  const { t, i18n } = useTranslation();
  const langCode = (i18n.resolvedLanguage ?? i18n.language ?? "").toLowerCase();
  const isRTL = langCode.startsWith("ar");

  const [hostedIntent, setHostedIntent] =
    useState<HostedInvoiceIntentResponse | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isVerifyingInvoice, setIsVerifyingInvoice] = useState(false);

  useEffect(() => {
    if (!visible) {
      setHostedIntent(null);
      setIntentError(null);
      setIntentLoading(false);
      setIsVerifyingInvoice(false);
    }
  }, [visible]);

  const recordTransactionAndSuccess = async (response: HostedInvoicePayment) => {
    const projectIdNum = parseInt(
      String(response.metadata?.project_id ?? projectId),
      10
    );
    const payload: CreateTransactionRequest = {
      project_id: projectIdNum,
      transaction_id: response.id,
      type: normalizeTransactionType(
        String(response.metadata?.type ?? "project_publication")
      ),
      amount: Number(response.amount ?? 0) / 100,
      fee: Number(response.fee ?? 0) / 100,
      currency: response.currency ?? currency,
      status: String(response.status),
      payment_method: String(response.source?.type ?? "unknown"),
      payment_gateway: "moyasar",
      notes: response.description ?? "",
    };
    try {
      await createTransaction(payload);
      onPaymentSuccess(String(projectIdNum));
    } catch (err) {
      console.error("Failed to record transaction:", err);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("transaction_record_failed", {
          defaultValue: "Payment succeeded but we could not record the transaction. Please contact support.",
        }),
      });
      onPaymentSuccess();
    }
  };

  const startHostedPayment = async () => {
    setIntentLoading(true);
    setIntentError(null);
    try {
      const intent = await createHostedExistingIntent(parseInt(projectId, 10));
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
  };

  const finalizeHostedInvoice = async () => {
    if (!hostedIntent || isVerifyingInvoice) return;
    setIsVerifyingInvoice(true);
    try {
      const status = await fetchHostedInvoiceStatus(hostedIntent.invoice_id);
      const payment = status.payment;
      if (!payment) {
        Toast.show({
          type: "error",
          text1: t("payment_failed"),
          text2: t("payment_unsuccessful"),
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onPaymentCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onPaymentCancel}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24}
              color={Colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("payment_methods", { defaultValue: "Payment Methods" })}
          </Text>
          <View style={styles.placeholder} />
        </View>

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
            <Text style={styles.intentTitle}>
              {t("secure_payment", { defaultValue: "Secure Payment" })}
            </Text>
            <Text style={styles.intentDescription}>{description}</Text>
            <SaudiRiyalAmount
              value={(amount / 100).toFixed(2)}
              currency={currency}
              textStyle={styles.intentAmount}
              containerStyle={styles.intentAmountRow}
            />
            {intentError ? <Text style={styles.configError}>{intentError}</Text> : null}
            <TouchableOpacity
              style={[styles.payButton, intentLoading && styles.payButtonDisabled]}
              disabled={intentLoading}
              onPress={startHostedPayment}
            >
              {intentLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.payButtonText}>
                  {t("continue_to_payment", {
                    defaultValue: "Continue to Payment",
                  })}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    margin: 16,
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
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
    padding: 16,
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
  },
  intentAmountRow: {
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
    textAlign: "left",
  },
});
