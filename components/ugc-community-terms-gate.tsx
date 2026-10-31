import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onAccept: () => void | Promise<void>;
};

const CHAT_RULE_KEYS = [
  "ugc_terms_rule_no_abusive",
  "ugc_terms_rule_no_harassment",
  "ugc_terms_rule_no_illegal",
  "ugc_terms_rule_block_ban",
] as const;

export function UgcCommunityTermsGate({ visible, onAccept }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text
            style={[
              styles.title,
              { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoBold },
            ]}
          >
            {t("ugc_terms_title")}
          </Text>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text
              style={[
                styles.intro,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
              ]}
            >
              {t("ugc_terms_intro")}
            </Text>
            {CHAT_RULE_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.bulletRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text style={[styles.bulletMark, isRTL ? { marginRight: 0, marginLeft: 10 } : { marginRight: 10 }]}>
                  •
                </Text>
                <Text
                  style={[
                    styles.bulletText,
                    { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
                  ]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
            <Text
              style={[
                styles.footer,
                { textAlign: isRTL ? "right" : "left", fontFamily: Fonts.CairoRegular },
              ]}
            >
              {t("ugc_terms_footer")}
            </Text>
          </ScrollView>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkBtn}
            onPress={() => router.push("/terms-and-privacy")}
          >
            <Text
              style={[
                styles.linkText,
                { textAlign: "center", fontFamily: Fonts.CairoSemiBold },
              ]}
            >
              {t("read_full_terms")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => void onAccept()}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: Fonts.CairoSemiBold }]}>
              {t("ugc_terms_agree")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,35,71,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 22,
    maxHeight: 560,
  },
  title: {
    fontSize: 18,
    color: "#002347",
    marginBottom: 12,
  },
  scroll: { maxHeight: 360 },
  scrollContent: { paddingBottom: 8 },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  bulletRow: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletMark: {
    fontSize: 16,
    lineHeight: 22,
    color: "#002347",
    fontFamily: Fonts.CairoBold,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
  footer: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#555",
  },
  linkBtn: {
    marginTop: 14,
    paddingVertical: 10,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 15,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
  },
});
