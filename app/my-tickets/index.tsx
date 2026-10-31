import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ticket, ticketService } from "@/services/ticket-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusColors: Record<string, string> = {
  open: "#3498db",
  in_progress: "#f39c12",
  resolved: "#27ae60",
};

export default function MyTicketsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const res = await ticketService.getTickets();
      const list = Array.isArray(res.data) ? res.data : (res as unknown as { data?: Ticket[] }).data ?? [];
      setTickets(list);
    } catch {
      setError(
        i18n.language === "ar"
          ? "تعذر تحميل التذاكر"
          : "Failed to load tickets"
      );
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const renderItem = ({ item }: { item: Ticket }) => {
    const statusKey = item.status?.replace("-", "_") ?? "open";
    const statusColor = statusColors[statusKey] ?? statusColors.open;

    return (
      <TouchableOpacity
        style={[styles.card, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        onPress={() => router.push({ pathname: "/ticket-detail", params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.cardContent, isRTL ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
          <Text
            style={[styles.cardSubject, { textAlign: isRTL ? "right" : "left" }]}
            numberOfLines={2}
          >
            {item.subject}
          </Text>
          <View style={[styles.metaRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{t(`ticket_status_${statusKey}`)}</Text>
            </View>
            {item.replies_count != null && item.replies_count > 0 && (
              <Text style={[styles.replyCount, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}>
                {item.replies_count} {t("replies")}
              </Text>
            )}
          </View>
          <Text style={[styles.cardDate, { textAlign: isRTL ? "right" : "left" }]}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US") : ""}
          </Text>
        </View>
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={20}
          color={Colors.placeholder}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTickets}>
            <Text style={styles.retryText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Ionicons name="ticket-outline" size={64} color={Colors.placeholder} />
        <Text style={[styles.emptyText, { textAlign: isRTL ? "right" : "left" }]}>
          {t("no_tickets_yet")}
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/create-ticket")}
        >
          <Text style={styles.createButtonText}>{t("create_ticket")}</Text>
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.headerTitle}>{t("technical_support")}</Text>
        <TouchableOpacity
          style={[styles.addButton, isRTL ? { marginRight: "auto" } : { marginLeft: "auto" }]}
          onPress={() => router.push("/create-ticket")}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={renderEmpty}
        />
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
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    fontFamily: Fonts.CairoBold,
  },
  addButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
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
  emptyText: { fontSize: 14, color: Colors.text.secondary, marginBottom: 20, fontFamily: Fonts.CairoSemiBold },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 14, fontFamily: Fonts.CairoBold },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  metaRow: { alignItems: "center", marginBottom: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600", fontFamily: Fonts.CairoRegular },
  replyCount: { fontSize: 12, color: Colors.text.secondary, fontFamily: Fonts.CairoRegular },
  cardDate: { fontSize: 12, color: Colors.text.secondary, fontFamily: Fonts.CairoRegular },
});
