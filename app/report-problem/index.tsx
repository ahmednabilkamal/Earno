import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { ticketService } from "@/services/ticket-service";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ReportProblemScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language.startsWith("ar");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      Alert.alert(
        t("error"),
        t("provide_description", { defaultValue: "Please describe the problem or suggestion." })
      );
      return;
    }
    if (trimmedMessage.length < 10) {
      Alert.alert(
        t("error"),
        t("provide_longer_description", { defaultValue: "Please write a longer description (at least 10 characters)." })
      );
      return;
    }

    try {
      setSubmitting(true);
      const subject = t("report_mobile_subject", { defaultValue: "Report from mobile app" });
      const ticket = await ticketService.createTicket(
        subject,
        "technical",
        trimmedMessage
      );
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("report_sent_success", { defaultValue: "Your report has been sent successfully. Thank you for your feedback." }),
      });
      setMessage("");
      router.replace({ pathname: "/ticket-detail", params: { id: String(ticket.id) } });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failed_send_report", { defaultValue: "Failed to send report. Please try again." }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientOverlay />
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            isRTL ? { marginLeft: 10 } : { marginRight: 10 },
          ]}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={22}
            color={Colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("report_problem")}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.paragraph,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("report_problem_intro", { defaultValue: "If you experienced any issue while using the app or have a suggestion to improve the platform, please describe it below." })}
        </Text>

        <TextInput
          style={[
            styles.textArea,
            {
              textAlignVertical: "top",
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          multiline
          numberOfLines={6}
          value={message}
          onChangeText={setMessage}
          placeholder={t("report_placeholder", { defaultValue: "Write your problem or suggestion here..." })}
          placeholderTextColor={Colors.placeholder}
          {...withoutCredentialAutofill()}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? t("loading") : t("send_report", { defaultValue: "Send Report" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    fontFamily: Fonts.CairoBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text.secondary,
    marginBottom: 16,
    fontFamily: Fonts.CairoRegular,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 20,
    fontFamily: Fonts.CairoRegular,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.CairoBold,
  },
});

