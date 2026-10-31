import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal-amount";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
} from "react-native";
import {
  ApplePay,
  ApplePayConfig,
  CreditCard,
  CreditCardConfig,
  GeneralError,
  NetworkEndpointError,
  NetworkError,
  PaymentConfig,
  PaymentResponse,
  PaymentResult,
  PaymentStatus,
  SamsungPay,
  SamsungPayConfig,
  StcPay,
  TokenResponse,
} from "react-native-moyasar-sdk";

/** Parent screens may set `direction: 'rtl'`, which mirrors flex/start/end. Isolate with LTR + flex align so Arabic titles sit on the physical right. */
function RtlAnchoredText({
  isRTL,
  textStyle,
  children,
}: {
  isRTL: boolean;
  textStyle: StyleProp<TextStyle>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.titleAnchor,
        isRTL ? styles.titleAnchorEnd : styles.titleAnchorStart,
      ]}
    >
      <Text
        style={[
          textStyle,
          styles.titleAnchorText,
          {
            textAlign: isRTL ? "right" : "left",
            writingDirection: isRTL ? "rtl" : "ltr",
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

interface MoyasarPaymentProps {
  amount: number; // Amount in the smallest currency unit (e.g., 20000 = 200.00 SAR)
  currency?: string; // Default: SAR
  description?: string;
  /** When false, parent provides its own order summary (no duplicate header) */
  showHeaderSummary?: boolean;
  publishableApiKey: string;
  applePayMerchantId?: string;
  samsungPayServiceId?: string;
  merchantCountryCode?: string;
  manualCapture?: boolean; // Authorize only, capture later (e.g. on admin approval)
  onPaymentResult: (result: PaymentResult) => void;
  metadata?: Record<string, any>;
  /** When true, skip Alert dialogs so parent can use Toast */
  suppressAlerts?: boolean;
}

export const MoyasarPayment: React.FC<MoyasarPaymentProps> = ({
  amount,
  currency = "SAR",
  description = "Payment",
  showHeaderSummary = true,
  publishableApiKey,
  applePayMerchantId,
  samsungPayServiceId,
  merchantCountryCode = "SA",
  manualCapture = false,
  onPaymentResult,
  metadata = {},
  suppressAlerts = false,
}) => {
  const { t, i18n } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const langCode = (i18n.resolvedLanguage ?? i18n.language ?? "").toLowerCase();
  const isRTL = langCode.startsWith("ar");

  const timeoutRef = useRef<number | null>(null);
  const paymentStartTimeRef = useRef<number | null>(null);

  // Validate API key and log payment config
  useEffect(() => {
    console.log("🔑 Moyasar Payment Config:", {
      hasApiKey: !!publishableApiKey && publishableApiKey !== "YOUR_PUBLISHABLE_API_KEY",
      apiKeyPrefix: publishableApiKey?.substring(0, 10) + "...",
      amount,
      currency,
      description,
      metadata,
    });

    if (!publishableApiKey || publishableApiKey === "YOUR_PUBLISHABLE_API_KEY") {
      console.warn("⚠️ Moyasar publishable API key is not set or using default value!");
      Alert.alert(
        t("error", { defaultValue: "Error" }),
        "Moyasar API key is not configured on the server. Please contact support."
      );
    }
  }, [publishableApiKey, amount, currency, description, metadata, t]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sharedMoyasarTextInputStyle = useMemo(
    () => ({
      backgroundColor: Colors.surface,
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      minHeight: 50,
      marginVertical: 4,
      fontSize: 16,
      fontFamily: Fonts.AlmaraiRegular,
      color: Colors.text.primary,
    }),
    []
  );

  const sharedMoyasarSdkContainerStyle = useMemo(
    () => ({
      width: "100%" as const,
      alignSelf: "stretch" as const,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
      paddingTop: 4,
    }),
    []
  );

  const moyCreditCardStyle = useMemo(
    () => ({
      container: sharedMoyasarSdkContainerStyle,
      textInputs: sharedMoyasarTextInputStyle,
      textInputsPlaceholderColor: Colors.inputPlaceholder,
      paymentButton: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        minHeight: 52,
        marginTop: 16,
        ...Platform.select({
          ios: {
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      },
      paymentButtonText: {
        color: Colors.text.inverse,
        fontFamily: Fonts.CairoSemiBold,
        fontSize: 16,
      },
      errorText: {
        color: Colors.error,
        fontSize: 12,
        fontFamily: Fonts.AlmaraiRegular,
        marginTop: 2,
      },
      activityIndicatorColor: Colors.text.inverse,
      webviewActivityIndicatorColor: Colors.primary,
    }),
    [sharedMoyasarSdkContainerStyle, sharedMoyasarTextInputStyle]
  );

  const moyStcPayStyle = useMemo(
    () => ({
      container: sharedMoyasarSdkContainerStyle,
      title: {
        color: Colors.text.primary,
        fontFamily: Fonts.CairoSemiBold,
        fontSize: 16,
        marginBottom: 4,
      },
      textInputs: sharedMoyasarTextInputStyle,
      textInputsPlaceholderColor: Colors.inputPlaceholder,
      paymentButton: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        minHeight: 52,
        marginTop: 16,
        ...Platform.select({
          ios: {
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      },
      paymentButtonText: {
        color: Colors.text.inverse,
        fontFamily: Fonts.CairoSemiBold,
        fontSize: 16,
      },
      errorText: {
        color: Colors.error,
        fontSize: 12,
        fontFamily: Fonts.AlmaraiRegular,
        marginTop: 2,
      },
      activityIndicatorColor: Colors.text.inverse,
    }),
    [sharedMoyasarSdkContainerStyle, sharedMoyasarTextInputStyle]
  );

  // Create payment configuration
  const paymentConfig = new PaymentConfig({
    publishableApiKey: publishableApiKey,
    amount: amount,
    currency: currency,
    merchantCountryCode: merchantCountryCode,
    description: description,
    metadata: metadata,
    supportedNetworks: ["mada", "visa", "mastercard", "amex"],
    creditCard: new CreditCardConfig({
      saveCard: false,
      manual: manualCapture,
    }),
    ...(applePayMerchantId && {
      applePay: new ApplePayConfig({
        merchantId: applePayMerchantId,
        label: description,
        manual: manualCapture,
        saveCard: false,
      }),
    }),
    ...(samsungPayServiceId && {
      samsungPay: new SamsungPayConfig({
        serviceId: samsungPayServiceId,
        merchantName: description,
        orderNumber: undefined, // Optional - defaults to random UUID
        manual: manualCapture,
      }),
    }),
    createSaveOnlyToken: false,
    applyCoupon: true,
  });

  // Handle payment result
  const handlePaymentResult = (paymentResult: PaymentResult) => {
    // Clear timeout and reset processing state
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsProcessing(false);

    if (paymentStartTimeRef.current) {
      const duration = Date.now() - paymentStartTimeRef.current;
      console.log(`✅ Payment processing completed in ${duration}ms`);
      paymentStartTimeRef.current = null;
    }

    console.log("📦 Payment result received:", {
      type: paymentResult.constructor.name,
      status: paymentResult instanceof PaymentResponse ? paymentResult.status : "N/A",
      hasError: !(paymentResult instanceof PaymentResponse || paymentResult instanceof TokenResponse),
    });

    if (paymentResult instanceof PaymentResponse) {
      switch (paymentResult.status) {
        case PaymentStatus.paid:
          console.log("Payment successful:", paymentResult);
          if (!suppressAlerts) {
            Alert.alert(
              t("payment_successful", { defaultValue: "Payment Successful" }),
              t("payment_completed", {
                defaultValue: "Your payment has been completed successfully.",
              })
            );
          }
          break;
        case PaymentStatus.failed:
          console.log("Payment failed:", paymentResult);
          if (!suppressAlerts) {
            Alert.alert(
              t("payment_failed", { defaultValue: "Payment Failed" }),
              t("payment_unsuccessful", {
                defaultValue: "Your payment was unsuccessful. Please try again.",
              })
            );
          }
          break;
        case PaymentStatus.authorized:
          // Payment authorized (for manual payments)
          console.log("Payment authorized:", paymentResult);
          break;
        default:
          console.log("Payment status:", paymentResult.status);
      }
    } else if (paymentResult instanceof TokenResponse) {
      // Token response (for save only token flow)
      console.log("Token response:", paymentResult);
    } else {
      if (paymentResult instanceof NetworkEndpointError) {
        console.error("Network endpoint error:", paymentResult);
        if (!suppressAlerts) Alert.alert(t("error", { defaultValue: "Error" }), t("network_endpoint_error", { defaultValue: "Network endpoint error. Please try again." }));
      } else if (paymentResult instanceof NetworkError) {
        console.error("Network error:", paymentResult);
        if (!suppressAlerts) Alert.alert(t("error", { defaultValue: "Error" }), t("network_error", { defaultValue: "Network error. Please check your connection." }));
      } else if (paymentResult instanceof GeneralError) {
        console.error("General error:", paymentResult);
        if (!suppressAlerts) Alert.alert(t("error", { defaultValue: "Error" }), paymentResult.message || t("something_went_wrong"));
      } else {
        console.error("Unknown payment error:", paymentResult);
        if (!suppressAlerts) Alert.alert(t("error", { defaultValue: "Error" }), t("something_went_wrong", { defaultValue: "Something went wrong. Please try again." }));
      }
    }

    // Call the callback
    onPaymentResult(paymentResult);
  };

  // Enhanced payment result handler with timeout protection
  const enhancedPaymentResultHandler = (paymentResult: PaymentResult) => {
    // Mark processing as started when we receive the first result
    if (!paymentStartTimeRef.current && !isProcessing) {
      setIsProcessing(true);
      paymentStartTimeRef.current = Date.now();
      console.log("🔄 Payment processing started...");

      // Set a timeout for payment processing (60 seconds)
      timeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        console.error("❌ Payment timeout: No response after 60 seconds");
        Alert.alert(
          t("error", { defaultValue: "Error" }),
          t("payment_timeout", {
            defaultValue: "Payment is taking too long. Please check your connection and try again.",
          })
        );
        // Call callback with timeout error
        onPaymentResult(
          new GeneralError("Payment timeout: No response after 60 seconds")
        );
      }, 60000); // 60 seconds timeout
    }

    handlePaymentResult(paymentResult);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {showHeaderSummary && (
        <View style={styles.header}>
          <RtlAnchoredText isRTL={isRTL} textStyle={styles.title}>
            {t("payment_methods", { defaultValue: "Payment Methods" })}
          </RtlAnchoredText>
          <RtlAnchoredText isRTL={isRTL} textStyle={styles.description}>
            {description}
          </RtlAnchoredText>
          <SaudiRiyalAmount
            value={(amount / 100).toFixed(2)}
            currency={currency}
            textStyle={styles.summaryAmount}
            containerStyle={[
              styles.summaryAmountRow,
              isRTL ? styles.summaryAmountRowRTL : styles.summaryAmountRowLTR,
            ]}
          />
        </View>
      )}

      {/* Loading Indicator */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {t("processing_payment", {
                defaultValue: "Processing payment...",
              })}
            </Text>
            <Text style={styles.loadingSubtext}>
              {t("please_wait", { defaultValue: "Please wait" })}
            </Text>
          </View>
        </View>
      )}

      {/* Credit Card Payment */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <RtlAnchoredText isRTL={isRTL} textStyle={styles.sectionTitle}>
            {t("credit_card", { defaultValue: "Credit Card" })}
          </RtlAnchoredText>
          <CreditCard
            paymentConfig={paymentConfig}
            onPaymentResult={(result) => {
              console.log("CreditCard payment result received");
              enhancedPaymentResultHandler(result);
            }}
            style={moyCreditCardStyle}
          />
        </View>
      </View>

      {/* Stc Pay - only when not manual capture; SDK does not support authorize-only for StcPay */}
      {!manualCapture && (
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <RtlAnchoredText isRTL={isRTL} textStyle={styles.sectionTitle}>
              {t("stc_pay", { defaultValue: "Stc Pay" })}
            </RtlAnchoredText>
            <StcPay
              paymentConfig={paymentConfig}
              onPaymentResult={(result) => {
                console.log("StcPay payment result received");
                enhancedPaymentResultHandler(result);
              }}
              style={moyStcPayStyle}
            />
          </View>
        </View>
      )}

      {/* Apple Pay (iOS only) */}
      {applePayMerchantId && (
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <RtlAnchoredText isRTL={isRTL} textStyle={styles.sectionTitle}>
              {t("apple_pay", { defaultValue: "Apple Pay" })}
            </RtlAnchoredText>
            <ApplePay
              paymentConfig={paymentConfig}
              onPaymentResult={(result) => {
                console.log("ApplePay payment result received");
                enhancedPaymentResultHandler(result);
              }}
              style={{
                buttonType: "buy",
                buttonStyle: "black",
                width: "100%",
                height: 50,
                cornerRadius: 10,
              }}
            />
          </View>
        </View>
      )}

      {/* Samsung Pay (Android only) */}
      {samsungPayServiceId && (
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <RtlAnchoredText isRTL={isRTL} textStyle={styles.sectionTitle}>
              {t("samsung_pay", { defaultValue: "Samsung Pay" })}
            </RtlAnchoredText>
            <SamsungPay
              paymentConfig={paymentConfig}
              onPaymentResult={(result) => {
                console.log("SamsungPay payment result received");
                enhancedPaymentResultHandler(result);
              }}
              style={{
                width: "100%",
                height: 50,
                cornerRadius: 10,
              }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  titleAnchor: {
    width: "100%",
    direction: "ltr",
  },
  titleAnchorStart: {
    alignItems: "flex-start",
  },
  titleAnchorEnd: {
    alignItems: "flex-end",
  },
  titleAnchorText: {
    maxWidth: "100%",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.stepBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
  },
  summaryAmountRow: {
    marginTop: 8,
  },
  summaryAmountRowLTR: {
    justifyContent: "flex-start",
  },
  summaryAmountRowRTL: {
    justifyContent: "flex-end",
  },
  summaryAmount: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.secondary,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginBottom: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
});