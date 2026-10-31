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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type Category = "technical" | "billing" | "general";

const categories: { value: Category; labelKey: string }[] = [
  { value: "technical", labelKey: "technical" },
  { value: "billing", labelKey: "billing" },
  { value: "general", labelKey: "general" },
];

export default function CreateTicketScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          i18n.language === "ar"
            ? "يرجى إدخال عنوان للتذكرة."
            : "Please enter a subject for the ticket.",
      });
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          i18n.language === "ar"
            ? "يرجى كتابة رسالة (10 أحرف على الأقل)."
            : "Please write a message (at least 10 characters).",
      });
      return;
    }

    try {
      setSubmitting(true);
      const ticket = await ticketService.createTicket(trimmedSubject, category, trimmedMessage);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("ticket_created_success"),
      });
      router.replace({ pathname: "/ticket-detail", params: { id: String(ticket.id) } });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      const errorCode = axiosErr?.response?.data?.error;
      const serverMsg = axiosErr?.response?.data?.message;
      const isLimitReached = errorCode === "OPEN_TICKET_LIMIT_REACHED";
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: isLimitReached ? t("open_tickets_limit_reached") : (serverMsg || t("ticket_create_failed")),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientOverlay />
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={22}
            color={Colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("create_ticket")}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("ticket_subject")} *
        </Text>
        <TextInput
          style={[
            styles.input,
            { textAlign: isRTL ? "right" : "left" },
          ]}
          value={subject}
          onChangeText={setSubject}
          placeholder={
            i18n.language === "ar"
              ? "مثال: مشكلة في تسجيل الدخول"
              : "e.g. Login issue"
          }
          placeholderTextColor={Colors.placeholder}
          {...withoutCredentialAutofill()}
        />

        <Text
          style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("ticket_category")} *
        </Text>
        <View style={[styles.categoryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.categoryChip,
                category === c.value && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(c.value)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  category === c.value && styles.categoryChipTextActive,
                ]}
              >
                {t(c.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("ticket_message")} *
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
          placeholder={
            i18n.language === "ar"
              ? "وصف مشكلتك أو استفسارك بالتفصيل..."
              : "Describe your issue or inquiry in detail..."
          }
          placeholderTextColor={Colors.placeholder}
          {...withoutCredentialAutofill()}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? t("loading") : t("submit")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
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
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: Fonts.CairoSemiBold,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 14,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: Fonts.CairoRegular,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  categoryChipText: { fontSize: 14, color: Colors.text.secondary, fontFamily: Fonts.CairoRegular },
  categoryChipTextActive: { color: Colors.primary, fontWeight: "600", fontFamily: Fonts.CairoBold },
  textArea: {
    minHeight: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 14,
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 24,
    fontFamily: Fonts.CairoRegular,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: Fonts.CairoBold },
});
