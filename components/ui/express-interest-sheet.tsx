import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { interestService } from "@/services/interest-service";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

interface ExpressInterestSheetProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  suggestedAmount?: number;
  minInvestment?: number;
  maxInvestment?: number | null;
  onSuccess?: () => void;
}

export const ExpressInterestSheet = ({
  visible,
  onClose,
  projectId,
  suggestedAmount = 1000,
  minInvestment = 100,
  maxInvestment = null,
  onSuccess,
}: ExpressInterestSheetProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [investmentAmount, setInvestmentAmount] = useState(
    String(suggestedAmount || minInvestment || 1000)
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(investmentAmount?.replace(/[^0-9.]/g, "") || "0");
    if (isNaN(amount) || amount < 100) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("investment_amount_min_100", {
          defaultValue: "Investment amount must be at least 100 Saudi Riyals",
        }),
      });
      return;
    }
    if (minInvestment != null && amount < minInvestment) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("investment_amount_min", {
          defaultValue: "Minimum investment is {{amount}} Saudi Riyals",
          amount: minInvestment.toLocaleString(),
        }),
      });
      return;
    }
    if (maxInvestment != null && amount > maxInvestment) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("investment_amount_max", {
          defaultValue: "Maximum investment is {{amount}} Saudi Riyals",
          amount: maxInvestment.toLocaleString(),
        }),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await interestService.expressInterest({
        projectId,
        investmentAmount: amount,
        message: message || undefined,
      });
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("interest_expressed_success", {
          defaultValue: "Interest expressed successfully",
        }),
      });
      onSuccess?.();
      onClose();
      setInvestmentAmount(String(suggestedAmount || minInvestment || 1000));
      setMessage("");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: error?.message || t("failed_to_express_interest", { defaultValue: "Failed to express interest" }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.centered}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheet, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
              <View style={styles.handle} />
              <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
                {t("express_interest", { defaultValue: "Express Interest" })}
              </Text>
              <Text style={[styles.hint, { textAlign: isRTL ? "right" : "left" }]}>
                {t("express_interest_hint", {
                  defaultValue: "Enter your investment amount and optional message to the project owner.",
                })}
              </Text>

              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>
                {t("investment_amount", { defaultValue: "Investment Amount" })} *
              </Text>
              <Image
                source={require("@/assets/images/real_currency.png")}
                style={[styles.currencySymbol, isRTL ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                keyboardType="numeric"
                placeholder={String(minInvestment)}
                placeholderTextColor="#999"
                {...withoutCredentialAutofill()}
              />

              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>
                {t("message_optional", { defaultValue: "Message (optional)" })}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder={t("message_placeholder", { defaultValue: "Add a message for the project owner..." })}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                {...withoutCredentialAutofill()}
              />

              <View style={[styles.buttons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, isRTL && { marginLeft: 12, marginRight: 0 }]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelText}>{t("cancel", { defaultValue: "Cancel" })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isRTL && { marginRight: 12, marginLeft: 0 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>
                      {t("express_interest", { defaultValue: "Express Interest" })}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  centered: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: "#002347",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.CairoSemiBold,
    color: "#333",
    marginBottom: 8,
  },
  currencySymbol: {
    width: 18,
    height: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    width: "100%",
    maxWidth: 320,
    minWidth: 280,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    width: "100%",
    maxWidth: 320,
    minWidth: 280,
  },
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: "#666",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: "#fff",
  },
});
