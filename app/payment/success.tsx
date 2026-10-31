import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const options = {
  headerShown: false,
};

export default function PaymentSuccessScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";

  const projectId = params.projectId ? String(params.projectId) : undefined;
  const isOwnProject = params.isOwnProject === "1" || params.isOwnProject === "true";

  const goToProject = () => {
    if (projectId) {
      router.replace({
        pathname: "/project-details",
        params: { id: projectId, isOwnProject: isOwnProject ? "1" : "0" },
      });
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const goHome = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={Colors.success}
          />
        </View>

        <Text style={styles.title}>
          {t("payment_successful", { defaultValue: "Payment Successful" })}
        </Text>

        <Text style={styles.message}>
          {t("payment_completed", {
            defaultValue: "Your payment has been completed successfully.",
          })}
        </Text>

        <View style={styles.buttonContainer}>
          {projectId && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goToProject}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t("see_project_details", {
                  defaultValue: "See Project Details",
                })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, !projectId && styles.secondaryButtonFull]}
            onPress={goHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>
              {t("go_to_home", { defaultValue: "Go to Home" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  contentRTL: {
    direction: "rtl",
  },
  iconWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: "#fff",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryButtonFull: {
    marginTop: 0,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.primary,
  },
});
