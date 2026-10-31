import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ticket, ticketService } from "@/services/ticket-service";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TicketDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? parseInt(params.id, 10) : 0;
  const isRTL = i18n.language === "ar" || I18nManager.isRTL;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!id || isNaN(id)) return;
    try {
      setError(null);
      const data = await ticketService.getTicket(id);
      setTicket(data);
    } catch (err) {
      setError(
        i18n.language === "ar"
          ? "تعذر تحميل التذكرة"
          : "Failed to load ticket"
      );
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id, i18n.language]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const statusLabel =
    ticket?.status === "in_progress"
      ? t("ticket_status_in_progress")
      : ticket?.status === "resolved"
        ? t("ticket_status_resolved")
        : t("ticket_status_open");

  const categoryLabel =
    ticket?.category === "technical"
      ? t("technical")
      : ticket?.category === "billing"
        ? t("billing")
        : t("general");

  const handleSendReply = async () => {
    const msg = replyText.trim();
    if (!msg || sending || !ticket || ticket.status === "resolved") return;
    try {
      setSending(true);
      const updated = await ticketService.replyTicket(ticket.id, msg);
      setTicket(updated);
      setReplyText("");
    } catch (err) {
      // Could show Toast
    } finally {
      setSending(false);
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {ticket?.subject ?? t("ticket_detail")}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error || !ticket ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? t("ticket_not_found")}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>{t("go_back")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={[styles.content, { direction: isRTL ? "rtl" : "ltr" }]}
            contentContainerStyle={[styles.contentContainer, { direction: isRTL ? "rtl" : "ltr" }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.metaRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <Text style={[styles.metaText, { textAlign: isRTL ? "right" : "left" }]}>
                {t("category")}: {categoryLabel}
              </Text>
              <Text style={[styles.metaText, { textAlign: isRTL ? "right" : "left", marginHorizontal: 12 }]}>
                {t("status")}: {statusLabel}
              </Text>
              <Text style={[styles.metaText, { textAlign: isRTL ? "right" : "left" }]}>
                {ticket.created_at
                  ? new Date(ticket.created_at).toLocaleDateString(
                    i18n.language === "ar" ? "ar-SA" : "en-US"
                  )
                  : ""}
              </Text>
            </View>

            {/* Chat thread: original message + replies in chronological order */}
            <View style={[styles.chatThread, { direction: isRTL ? "rtl" : "ltr" }]}>
              {/* Original message (user) */}
              <View
                style={[
                  styles.bubble,
                  styles.bubbleUser,
                  { alignSelf: isRTL ? "flex-start" : "flex-end" },
                ]}
              >
                <Text style={[styles.bubbleText, styles.bubbleTextUser, { textAlign: isRTL ? "right" : "left" }]}>
                  {ticket.message}
                </Text>
                <Text
                  style={[
                    styles.bubbleDate,
                    styles.bubbleDateUser,
                    { textAlign: isRTL ? "left" : "right" },
                  ]}
                >
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString(
                      i18n.language === "ar" ? "ar-SA" : "en-US"
                    )
                    : ""}
                </Text>
              </View>

              {/* Replies */}
              {(ticket.replies ?? []).map((reply) => (
                <View
                  key={reply.id}
                  style={[
                    styles.bubble,
                    reply.is_staff_reply ? styles.bubbleStaff : styles.bubbleUser,
                    { alignSelf: reply.is_staff_reply ? (isRTL ? "flex-end" : "flex-start") : (isRTL ? "flex-start" : "flex-end") },
                  ]}
                >
                  {reply.is_staff_reply && (
                    <Text
                      style={[
                        styles.bubbleAuthor,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {reply.user?.name ?? t("support_team")}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.bubbleText,
                      !reply.is_staff_reply && styles.bubbleTextUser,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {reply.message}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleDate,
                      !reply.is_staff_reply && styles.bubbleDateUser,
                      { textAlign: isRTL ? "left" : "right" },
                    ]}
                  >
                    {reply.created_at
                      ? new Date(reply.created_at).toLocaleString(
                        i18n.language === "ar" ? "ar-SA" : "en-US"
                      )
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {ticket.status !== "resolved" && (
            <View style={[styles.replyForm, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TextInput
                style={[
                  styles.replyInput,
                  {
                    textAlignVertical: "center",
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                multiline
                maxLength={1000}
                value={replyText}
                onChangeText={setReplyText}
                placeholder={t("type_message")}
                placeholderTextColor={Colors.placeholder}
                editable={!sending}
                {...withoutCredentialAutofill()}
              />
              <TouchableOpacity
                style={[
                  styles.sendIconButton,
                  (sending || !replyText.trim()) && styles.sendIconButtonDisabled,
                ]}
                onPress={handleSendReply}
                disabled={sending || !replyText.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
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
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    fontFamily: Fonts.CairoBold,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 14, color: Colors.text.secondary, marginBottom: 12, fontFamily: Fonts.CairoRegular },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600", fontFamily: Fonts.CairoBold, fontSize: 14 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 24 },
  metaRow: { marginBottom: 16, flexWrap: "wrap", gap: 8 },
  metaText: { fontSize: 12, color: Colors.text.secondary, fontFamily: Fonts.CairoRegular },
  chatThread: {
    marginTop: 8,
    gap: 12,
    alignSelf: "stretch",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
  },
  bubbleStaff: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  bubbleAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 6,
  },
  bubbleText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
    fontFamily: Fonts.CairoRegular,
  },
  bubbleTextUser: { color: "#fff", fontFamily: Fonts.CairoRegular, fontSize: 15 },
  bubbleDate: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 8,
    opacity: 0.9,
    fontFamily: Fonts.CairoRegular,
  },
  bubbleDateUser: { color: "rgba(255,255,255,0.9)" },
  replyForm: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: Colors.appBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: Fonts.CairoRegular,
  },
  sendIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIconButtonDisabled: { opacity: 0.5 },
});
