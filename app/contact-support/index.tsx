import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { supportService } from "@/services/support-service";

export default function ContactSupportScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [supportEmail, setSupportEmail] = useState("support@example.com");
  const [supportPhone, setSupportPhone] = useState("+966500000000");

  useEffect(() => {
    const loadSupportContact = async () => {
      try {
        const response = await supportService.getContact();
        if (response?.support_email) {
          setSupportEmail(response.support_email);
        }
        if (response?.support_phone) {
          setSupportPhone(response.support_phone);
        }
      } catch (error) {
        console.warn("Failed to load support contact from settings:", error);
      }
    };

    loadSupportContact();
  }, []);

  const handleEmail = async () => {
    try {
      await Linking.openURL(`mailto:${supportEmail}`);
    } catch {
      Toast.show({ type: "info", text1: t("email_unavailable", { defaultValue: "Email app not available" }), text2: supportEmail });
    }
  };

  const handlePhone = async () => {
    try {
      await Linking.openURL(`tel:${supportPhone}`);
    } catch {
      Toast.show({ type: "info", text1: t("phone_unavailable", { defaultValue: "Phone app not available" }), text2: supportPhone });
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
          {t("contact_customer_service")}
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
          {i18n.language === "ar"
            ? "فريق خدمة العملاء متواجد لمساعدتك في أي استفسار أو مشكلة تتعلق بحسابك أو مشاريعك الاستثمارية."
            : "Our customer service team is here to help you with any questions or issues related to your account or investment projects."}
        </Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <Ionicons name="mail-outline" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>
            {i18n.language === "ar" ? "إرسال بريد إلكتروني" : "Send Email"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handlePhone}>
          <Ionicons name="call-outline" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>
            {i18n.language === "ar" ? "الاتصال هاتفياً" : "Call Support"}
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
    marginBottom: 24,
    fontFamily: Fonts.CairoRegular,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Fonts.CairoBold,
  },
});

