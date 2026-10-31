import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NetworkErrorScreenProps {
  onRetry: () => void;
  message?: string;
}

export function NetworkErrorScreen({
  onRetry,
  message,
}: NetworkErrorScreenProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <View style={styles.container}>
      <View style={[styles.content, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={64}
            color={Colors.placeholder}
          />
        </View>
        <Text
          style={[
            styles.title,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("network_error_title", {
            defaultValue: "Connection Error",
          })}
        </Text>
        <Text
          style={[
            styles.message,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {message ??
            t("network_error_message", {
              defaultValue:
                "Please check your internet connection or try again later. The server may be temporarily unavailable.",
            })}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <Text style={styles.retryText}>
            {t("retry", { defaultValue: "Retry" })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  content: {
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 24,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
