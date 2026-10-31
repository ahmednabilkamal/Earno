import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function MaintenanceScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="build-outline" size={34} color="#0B2F63" />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t("maintenance_mode_badge", "نقوم حالياً بتحديث المنصة")}
          </Text>
        </View>

        <Text style={styles.title}>
          {t("maintenance_mode_title", "المنصة الآن في وضع الصيانة")}
        </Text>
        <Text style={styles.message}>
          {t(
            "maintenance_mode_message",
            "نعمل على تحسين الخدمة لضمان تجربة أفضل لك. نعتذر عن الإزعاج، وسيتم إعادة فتح المنصة خلال وقت قصير بإذن الله."
          )}
        </Text>
        <Text style={styles.hint}>
          {t("maintenance_mode_hint", "يمكنك المحاولة مرة أخرى بعد قليل.")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 26,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  badge: {
    alignSelf: "center",
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFE2FF",
    backgroundColor: "#EDF4FF",
  },
  badgeText: {
    color: "#0B3B7A",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0B2F63",
    marginBottom: 12,
    lineHeight: 40,
    textAlign: "center",
  },
  message: {
    fontSize: 17,
    lineHeight: 30,
    color: "#334155",
    textAlign: "center",
  },
  hint: {
    marginTop: 14,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
