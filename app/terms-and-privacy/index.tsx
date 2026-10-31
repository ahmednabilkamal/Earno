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

export default function TermsAndPrivacyScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const termsContentEn = [
    "By using this application, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Use and the Privacy Policy.",
    "The platform provides investment and project display services and does not provide direct financial or legal advice. You are solely responsible for your investment decisions.",
    "You agree not to misuse the application, including attempting to access data that does not belong to you, publishing misleading or illegal content, or interfering with the operation of the platform.",
    "Community and messaging: Messages, attachments, and other materials may be user-generated. Earno has zero tolerance for objectionable content and abusive users. You must comply with these terms. You can report objectionable content and block other members who behave abusively. Blocking notifies our team for review. We aim to review reports and take appropriate action within 24 hours, including removing content and restricting accounts that violate these terms.",
    "We are committed to protecting your personal data and using it only for the purposes necessary to operate and improve the service, in accordance with applicable laws and regulations.",
    "We may update these terms and the privacy policy from time to time. Continuing to use the application after any changes means that you accept the updated terms.",
  ];

  const termsContentAr = [
    "باستخدامك لهذا التطبيق، فإنك تقر بأنك قرأت وفهمت ووافقت على الالتزام بهذه الشروط وسياسة الخصوصية.",
    "توفر المنصة خدمات عرض الفرص الاستثمارية والمشاريع، ولا تقدم استشارات مالية أو قانونية مباشرة، وتتحمل وحدك مسؤولية قراراتك الاستثمارية.",
    "توافق على عدم إساءة استخدام التطبيق، بما في ذلك محاولة الوصول إلى بيانات لا تخصك، أو نشر محتوى مضلل أو غير قانوني، أو التدخل في عمل المنصة.",
    "المجتمع والمراسلة: قد تكون الرسائل والمرفقات وغيرها من المواد من إنشاء المستخدمين. لا تتسامح Earno مع المحتوى المرفوض أو المستخدمين المسيئين. يجب الالتزام بهذه الشروط. يمكنك الإبلاغ عن المحتوى المرفوض وحظر الأعضاء الآخرين عند الإساءة. يُبلَغ فريقنا عند الحظر للمراجعة. نسعى لمراجعة البلاغات واتخاذ الإجراء المناسب خلال 24 ساعة، بما في ذلك إزالة المحتوى وتقييد الحسابات المخالفة.",
    "نلتزم بحماية بياناتك الشخصية واستخدامها فقط للأغراض اللازمة لتشغيل الخدمة وتحسينها، وفقًا للأنظمة والقوانين المعمول بها.",
    "قد نقوم بتحديث هذه الشروط وسياسة الخصوصية من حين لآخر، ويُعد استمرارك في استخدام التطبيق بعد أي تعديلات قبولًا منك للشروط المحدّثة.",
  ];

  const content = i18n.language === "ar" ? termsContentAr : termsContentEn;

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
          {t("terms_and_privacy")}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {content.map((paragraph, index) => (
          <Text
            key={index}
            style={[
              styles.paragraph,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {paragraph}
          </Text>
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
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.apple,
    marginVertical: 16,
    fontFamily: Fonts.CairoRegular,
  },
});

