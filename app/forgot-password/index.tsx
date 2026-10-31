import { ThemedText } from "@/components/themed-text";
import { AuthBackButton } from "@/components/ui/auth-back-button";
import { CustomButton } from "@/components/ui/custom-button";
import CustomInput from "@/components/ui/custom-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { authService } from "@/services/auth-service";
import {
  isValidSaudiMobile,
  normalizePhoneDigits,
  toSaudiNationalPhone,
} from "@/utils/saudi-phone";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import loginStyles from "../login/styles";

const paramFirst = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export default function ForgotPasswordScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";
  const phoneCode = "+966";
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const prefillPhone = paramFirst(params.prefill_phone);
    if (prefillPhone) setPhone(prefillPhone);
  }, [params.prefill_phone]);

  const validatePhone = (): boolean => {
    if (!isValidSaudiMobile(phone)) {
      setError(t("enter_valid_mobile_short"));
      return false;
    }
    setError(undefined);
    return true;
  };

  const submit = async () => {
    if (!validatePhone()) return;
    setIsLoading(true);
    const nationalPhone = toSaudiNationalPhone(phone);
    try {
      await authService.sendForgotPasswordOtp(
        nationalPhone,
        phoneCode,
      );
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("otp_sent_to_phone"),
      });
      router.push({
        pathname: "/forgot-password/otp",
        params: { phone: nationalPhone, phone_code: phoneCode },
      });
    } catch (err: unknown) {
      const data = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const phoneErr = data?.response?.data?.errors?.phone;
      const fallback = data?.response?.data?.message;
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          Array.isArray(phoneErr) && phoneErr[0]
            ? phoneErr[0]
            : fallback || t("forgot_password_request_failed"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollProps = {
    style: loginStyles.contentAbove,
    contentContainerStyle: loginStyles.scrollContent,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    keyboardDismissMode: "interactive" as const,
  };

  const body = (
    <>
      <AuthBackButton
        isRTL={isRTL}
        label={t("go_back")}
        onPress={() => router.back()}
      />

      <View style={loginStyles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={loginStyles.logo}
          resizeMode="contain"
        />
        <ThemedText style={loginStyles.welcomeText}>
          {t("forgot_password_title")}
        </ThemedText>
        <ThemedText style={loginStyles.subtitleText}>
          {t("forgot_password_subtitle_otp")}
        </ThemedText>
      </View>

      <View style={loginStyles.form}>
        <View style={{ marginBottom: 8 }}>
          <ThemedText
            style={{
              marginBottom: 6,
              alignSelf: isRTL ? "flex-end" : "flex-start",
            }}
          >
            {t("mobile_number")}
          </ThemedText>
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 110,
              height: 50,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 8,
              backgroundColor: Colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ThemedText style={{ color: Colors.placeholder, fontSize: 16 }}>
              🇸🇦 +966
            </ThemedText>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomInput
              label=""
              placeholder={t("enter_your_mobile_number")}
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: 0 }}
              value={phone}
              onChangeText={(val) => {
                setPhone(normalizePhoneDigits(val).slice(0, 12));
                if (error) setError(undefined);
              }}
              error={error}
            />
          </View>
          </View>
        </View>

        <CustomButton
          title={t("send_verification_code")}
          onPress={submit}
          style={loginStyles.loginButton}
          isLoading={isLoading}
        />

        <View
          style={[
            loginStyles.footer,
            {
              flexDirection: isRTL ? "row-reverse" : "row",
              marginTop: 28,
              flexWrap: "wrap",
            },
          ]}
        >
          <ThemedText style={loginStyles.footerText}>
            {t("already_have_account")}{" "}
          </ThemedText>
          <Pressable
            onPress={() => router.replace("/login" as never)}
            accessibilityRole="link"
          >
            <ThemedText style={loginStyles.footerLink}>{t("login")}</ThemedText>
          </Pressable>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={loginStyles.safeArea}>
      <GradientOverlay />
      {Platform.OS === "web" ? (
        <ScrollView {...scrollProps}>{body}</ScrollView>
      ) : (
        <KeyboardAwareScrollView
          {...scrollProps}
          bottomOffset={16}
          extraKeyboardSpace={8}
        >
          {body}
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}
