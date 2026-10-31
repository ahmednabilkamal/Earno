import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FaqsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const faqs =
    i18n.language === "ar"
      ? [
        {
          q: "كيف أبدأ باستخدام المنصة؟",
          a: "يمكنك إنشاء حساب جديد كمستثمر أو صاحب مشروع، ثم استكشاف المشاريع أو إضافة مشروعك الخاص.",
        },
        {
          q: "هل تقدم المنصة استشارات استثمارية؟",
          a: "لا، المنصة توفر أدوات لعرض الفرص والاستثمار فقط، والقرارات الاستثمارية مسؤوليتك الخاصة.",
        },
        {
          q: "كيف أتواصل مع دعم العملاء؟",
          a: "يمكنك التواصل مع فريق الدعم من خلال صفحة خدمة العملاء داخل إعدادات التطبيق.",
        },
      ]
      : [
        {
          q: "How do I start using the platform?",
          a: "You can create a new account as an investor or project owner, then explore opportunities or add your own project.",
        },
        {
          q: "Does the platform provide investment advice?",
          a: "No, the platform only provides tools to list and discover opportunities. All investment decisions are your own responsibility.",
        },
        {
          q: "How can I contact customer support?",
          a: "You can reach the support team through the Customer Service screen inside the app settings.",
        },
      ];

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
          {t("faqs")}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {faqs.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <Text
              style={[
                styles.question,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {item.q}
            </Text>
            <Text
              style={[
                styles.answer,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {item.a}
            </Text>
          </View>
        ))}
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
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  question: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 6,
    fontFamily: Fonts.CairoSemiBold,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.secondary,
    fontFamily: Fonts.CairoRegular,
  },
});

