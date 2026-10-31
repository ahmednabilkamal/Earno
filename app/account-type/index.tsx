import { ThemedText } from "@/components/themed-text";
import { AuthBackButton } from "@/components/ui/auth-back-button";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

export default function AccountTypeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("investor");
  const isRTL = i18n.language === "ar";

  const accountTypes = [
    {
      id: "investor",
      title: t("investor"),
      description: t("investor_desc"),
      icon: "trending-up-outline" as const,
    },
    {
      id: "project_owner",
      title: t("project_owner"),
      description: t("project_owner_desc"),
      icon: "person-outline" as const,
    },
  ];

  const handleContinue = (id: string) => {
    setSelectedType(id);
    // Navigate to register with selected type
    router.push({
      pathname: "/register",
      params: { user_type: id },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/login" as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientOverlay />
      <ScrollView
        style={styles.contentAbove}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AuthBackButton
          isRTL={isRTL}
          label={t("go_back")}
          onPress={handleBack}
        />

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ThemedText style={styles.title}>{t("choose_account_type")}</ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("dont_worry_can_change")}
        </ThemedText>

        <View style={styles.cardsContainer}>
          {accountTypes.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.card,
                selectedType === type.id && styles.selectedCard,
              ]}
              onPress={() => handleContinue(type.id)}
            >
              <View
                style={[
                  styles.cardContent,
                  { flexDirection: isRTL ? "row" : "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.textContainer,
                    { alignItems: isRTL ? "flex-end" : "flex-start" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.cardTitle,
                      { textAlign: isRTL ? "right" : "left" },
                      selectedType === type.id && styles.selectedCardText,
                    ]}
                  >
                    {type.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.cardDescription,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {type.description}
                  </ThemedText>
                </View>
                <View style={styles.iconContainer}>
                  <Ionicons name={type.icon} size={40} color={Colors.white} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
