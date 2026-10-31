import registerStyles from "@/app/register/styles";
import { ThemedText } from "@/components/themed-text";
import { AuthBackButton } from "@/components/ui/auth-back-button";
import { CustomButton } from "@/components/ui/custom-button";
import { OtpCodeInput } from "@/components/ui/otp-code-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { authService } from "@/services/auth-service";
import {
  clearPasswordResetPending,
  setPasswordResetPending,
} from "@/utils/password-reset-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

export default function ForgotPasswordOtpScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string | string[];
  }>();
  const isRTL = i18n.language === "ar";

  const phoneNational = useMemo(() => {
    const raw = params.phone;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return typeof v === "string" ? v.trim() : "";
  }, [params.phone]);

  const phoneCode = "+966";

  const phoneDisplay =
    `${phoneCode} ${phoneNational}`.trim() ||
    `${phoneNational}`.trim();

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const resend = async () => {
    if (!phoneNational) return;
    setIsResending(true);
    try {
      await authService.sendForgotPasswordOtp(phoneNational, phoneCode);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("otp_resent"),
      });
    } catch (err: unknown) {
      const data = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const msg =
        data?.response?.data?.message || t("otp_resend_failed");
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: msg,
      });
    } finally {
      setIsResending(false);
    }
  };

  const verify = async () => {
    const code = otpCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setOtpError(t("enter_valid_otp"));
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enter_valid_otp"),
      });
      return;
    }
    setOtpError(undefined);
    if (!phoneNational) return;
    setIsVerifying(true);
    try {
      await clearPasswordResetPending();
      const { token } = await authService.verifyForgotPasswordOtp(
        phoneNational,
        code,
        phoneCode,
      );
      await setPasswordResetPending({
        phone: phoneNational,
        phoneCode,
        token,
      });
      router.replace("/reset-password" as never);
    } catch (err: unknown) {
      const data = err as {
        response?: { data?: { message?: string } };
      };
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          data?.response?.data?.message || t("otp_verification_failed"),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!phoneNational) {
      router.replace("/forgot-password" as never);
    }
  }, [phoneNational, router]);

  const scrollProps = {
    style: loginStyles.contentAbove,
    contentContainerStyle: loginStyles.scrollContent,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    keyboardDismissMode: "interactive" as const,
  };

  if (!phoneNational) {
    return null;
  }

  const body = (
    <>
      <AuthBackButton
        isRTL={isRTL}
        label={t("go_back")}
        onPress={() =>
          router.replace({
            pathname: "/forgot-password",
            params: {
              prefill_phone: phoneNational,
              prefill_phone_code: phoneCode,
            },
          } as never)
        }
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
          {t("password_reset_otp_subtitle")}
        </ThemedText>
      </View>

      <View style={loginStyles.form}>
        <View style={registerStyles.otpCard}>
          <ThemedText style={registerStyles.otpEmailText}>
            {t("otp_sent_to")}
          </ThemedText>
          <ThemedText style={registerStyles.otpEmailStrong}>{phoneDisplay}</ThemedText>

          <OtpCodeInput
            label={t("verification_code")}
            placeholder={t("otp_code_placeholder")}
            value={otpCode}
            containerStyle={registerStyles.otpInputContainer}
            error={otpError}
            onChangeDigits={(d) => {
              setOtpCode(d);
              if (otpError) setOtpError(undefined);
            }}
          />

          <CustomButton
            title={t("verify_and_continue")}
            onPress={verify}
            style={loginStyles.loginButton}
            isLoading={isVerifying}
          />

          <Pressable
            onPress={resend}
            style={registerStyles.otpResendLink}
            disabled={isResending}
          >
            <ThemedText style={registerStyles.otpResendText}>
              {isResending ? t("loading") : t("resend_code")}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/forgot-password",
                params: {
                  prefill_phone: phoneNational,
                  prefill_phone_code: phoneCode,
                },
              } as never)
            }
            style={registerStyles.otpEditLink}
          >
            <ThemedText style={registerStyles.otpEditText}>
              {t("password_reset_change_phone")}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/login" as never)}
            accessibilityRole="link"
            style={[registerStyles.otpEditLink, { marginTop: 8 }]}
          >
            <ThemedText style={registerStyles.otpForgotPwdText}>
              {t("back_to_login")}
            </ThemedText>
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
        <KeyboardAwareScrollView {...scrollProps} bottomOffset={16} extraKeyboardSpace={8}>
          {body}
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}
