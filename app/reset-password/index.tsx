import { ThemedText } from "@/components/themed-text";
import { AuthBackButton } from "@/components/ui/auth-back-button";
import { CustomButton } from "@/components/ui/custom-button";
import CustomInput from "@/components/ui/custom-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { authService } from "@/services/auth-service";
import {
  clearPasswordResetPending,
  getPasswordResetPending,
} from "@/utils/password-reset-session";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import loginStyles from "../login/styles";

export default function ResetPasswordScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const [hydrated, setHydrated] = useState(false);
  const [phoneNational, setPhoneNational] = useState("");
  const [phoneCode, setPhoneCode] = useState("+966");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPasswordResetPending().then((p) => {
      if (cancelled) return;
      if (!p) {
        Toast.show({
          type: "info",
          text1: t("password_reset_session_title"),
          text2: t("password_reset_session_expired"),
        });
        router.replace("/forgot-password" as never);
        return;
      }
      setPhoneNational(p.phone);
      setPhoneCode(p.phoneCode);
      setToken(p.token);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  const validateLocal = (): boolean => {
    let ok = true;
    if (!password) {
      setPwError(t("password_required"));
      ok = false;
    } else if (password.length < 8) {
      setPwError(t("password_too_short"));
      ok = false;
    } else if (!/[a-zA-Z]/.test(password)) {
      setPwError(t("password_must_contain_letter"));
      ok = false;
    } else if (!/\d/.test(password)) {
      setPwError(t("password_must_contain_number"));
      ok = false;
    } else {
      setPwError(undefined);
    }

    if (!confirmPassword) {
      setConfirmError(t("confirm_password_required"));
      ok = false;
    } else if (password !== confirmPassword) {
      setConfirmError(t("passwords_dont_match"));
      ok = false;
    } else {
      setConfirmError(undefined);
    }

    return ok;
  };

  const submit = async () => {
    if (!validateLocal() || !phoneNational || !token) return;

    setIsLoading(true);
    try {
      await authService.resetPasswordWithToken({
        phone: phoneNational,
        phoneCode,
        token,
        password,
        password_confirmation: confirmPassword,
      });
      await clearPasswordResetPending();
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("password_reset_success_login"),
      });
      router.replace("/login" as never);
    } catch (err: unknown) {
      const data = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      const errs = data?.response?.data?.errors;

      if (errs?.password?.[0]) {
        setPwError(errs.password[0]);
      }
      if (errs?.password_confirmation?.[0]) {
        setConfirmError(errs.password_confirmation[0]);
      }

      let msg =
        (typeof data?.response?.data?.message === "string" &&
          data.response.data.message.trim())
          ? data.response.data.message
          : "";
      const phoneErr = errs?.phone?.[0];
      const emailOrBroker = phoneErr ?? errs?.token?.[0];
      if (!msg && typeof emailOrBroker === "string" && emailOrBroker.trim()) {
        msg = emailOrBroker.trim();
      }
      if (!msg) {
        msg = t("password_reset_failed_generic");
      }

      Toast.show({
        type: "error",
        text1: t("error"),
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated) {
    return null;
  }

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
        label={t("back_to_login")}
        onPress={() => router.replace("/login" as never)}
      />

      <View style={loginStyles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={loginStyles.logo}
          resizeMode="contain"
        />
        <ThemedText style={loginStyles.welcomeText}>
          {t("set_new_password_title")}
        </ThemedText>
        <ThemedText style={loginStyles.subtitleText}>
          {t("set_new_password_subtitle")}
        </ThemedText>
      </View>

      <View style={loginStyles.form}>
        <CustomInput
          label={t("password")}
          placeholder={t("password")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (pwError) setPwError(undefined);
          }}
          error={pwError}
        />
        <CustomInput
          label={t("confirm_password")}
          placeholder={t("confirm_password_placeholder")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            if (confirmError) setConfirmError(undefined);
          }}
          error={confirmError}
        />

        <CustomButton
          title={t("save_password_and_login")}
          onPress={submit}
          style={loginStyles.loginButton}
          isLoading={isLoading}
        />
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
