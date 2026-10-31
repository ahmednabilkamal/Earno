import { ThemedText } from "@/components/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import CustomInput from "@/components/ui/custom-input";
import { OtpCodeInput } from "@/components/ui/otp-code-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { authService } from "@/services/auth-service";
import {
  getDeviceDisplayName,
  registerForPushNotificationsAsync,
} from "@/services/push-notification-service";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  getRememberedLoginPhone,
  setRememberedLoginPhone,
} from "@/utils/login-remember";
import {
  isValidSaudiMobile,
  normalizePhoneDigits,
  toSaudiNationalPhone,
} from "@/utils/saudi-phone";
import { Colors } from "@/constants/colors";
import styles from "./styles";

type WizardStep = "credentials" | "otp";

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const setAuth = useAuthStore((state) => state.setAuth);
  const phoneCode = "+966";

  const [wizardStep, setWizardStep] = useState<WizardStep>("credentials");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSms, setOtpSms] = useState("");
  const [smsCanonicalPhone, setSmsCanonicalPhone] = useState("");
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
    otpSms?: string;
  }>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await getRememberedLoginPhone();
      if (cancelled || !saved) return;
      setPhone(saved);
      setRememberMe(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateCredentials = () => {
    const newErrors: { phone?: string; password?: string } = {};
    if (!isValidSaudiMobile(phone)) {
      newErrors.phone = t("enter_valid_mobile_short");
    }

    if (!password) {
      newErrors.password = t("password_required");
    } else if (password.length < 6) {
      newErrors.password = t("password_too_short");
    }

    setErrors((prev) => ({ ...prev, ...newErrors, otpSms: undefined }));
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpStep = () => {
    const e: Record<string, string> = {};
    if (!otpSms || otpSms.length !== 6) {
      e.otpSms = t("enter_six_digit_sms_code");
    }
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const completeAuthenticatedLogin = async (nationalPhone: string) => {
    const expoToken = await registerForPushNotificationsAsync();
    const deviceName = getDeviceDisplayName();
    const response = await authService.login(
      nationalPhone,
      password,
      expoToken,
      deviceName,
      phoneCode
    );
    await setRememberedLoginPhone(rememberMe ? nationalPhone : null);
    await setAuth(response.user, response.token);
    Toast.show({
      type: "success",
      text1: t("success"),
      text2: t("login_success"),
    });
    router.replace("/home");
  };

  const handleLogin = async () => {
    if (!validateCredentials()) return;

    setIsLoading(true);
    try {
      const nationalPhone = toSaudiNationalPhone(phone);
      await completeAuthenticatedLogin(nationalPhone);
    } catch (error: unknown) {
      console.error("Login error:", error);
      const axiosErr = error as {
        response?: {
          status?: number;
          data?: {
            contact_verification_required?: boolean;
            phone?: string;
            message?: string;
          };
        };
      };
      const status = axiosErr.response?.status;
      const data = axiosErr.response?.data;
      const verificationRequired =
        data?.contact_verification_required === true ||
        (status === 403 && typeof data?.phone === "string" && data.phone.length > 0) ||
        (status === 403 &&
          typeof data?.message === "string" &&
          data.message.toLowerCase().includes("verify"));
      if (verificationRequired) {
        setIsSendingLoginOtp(true);
        try {
          const sendRes = await authService.sendPhoneOtp(
            phone,
            phoneCode,
            "login_contact_recovery"
          );
          setSmsCanonicalPhone(
            typeof sendRes.phone === "string" ? sendRes.phone : ""
          );
          setOtpSms("");
          setWizardStep("otp");
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("otp_sent_to_phone"),
          });
        } catch (sendErr: unknown) {
          console.error("Login OTP send error:", sendErr);
          const sendAxios = sendErr as {
            response?: { data?: { message?: string; errors?: Record<string, string[]> } };
          };
          const msg =
            sendAxios.response?.data?.errors?.phone?.[0] ||
            sendAxios.response?.data?.message ||
            t("could_not_send_sms");
          Toast.show({
            type: "error",
            text1: t("error"),
            text2: msg,
          });
        } finally {
          setIsSendingLoginOtp(false);
        }
        return;
      }
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          (typeof data?.message === "string"
            ? data.message
            : undefined) ?? t("login_failed"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginPhoneOtp = async () => {
    if (!validateOtpStep()) return;

    setIsVerifyingLoginOtp(true);
    try {
      await authService.verifyPhoneOtp(
        phone,
        otpSms,
        phoneCode,
        "login_contact_recovery"
      );
      const nationalPhone = toSaudiNationalPhone(phone);
      await completeAuthenticatedLogin(nationalPhone);
    } catch (error: unknown) {
      console.error("Login OTP verify error:", error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          axiosErr.response?.data?.message || t("otp_verification_failed"),
      });
    } finally {
      setIsVerifyingLoginOtp(false);
    }
  };

  const handleResendLoginOtp = async () => {
    setIsSendingLoginOtp(true);
    try {
      const sendRes = await authService.sendPhoneOtp(
        phone,
        phoneCode,
        "login_contact_recovery"
      );
      setSmsCanonicalPhone(
        typeof sendRes.phone === "string" ? sendRes.phone : ""
      );
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("otp_sent_to_phone"),
      });
    } catch (sendErr: unknown) {
      console.error("Login OTP resend error:", sendErr);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("otp_resend_failed"),
      });
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const scrollProps = {
    style: styles.contentAbove,
    contentContainerStyle: styles.scrollContent,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    keyboardDismissMode: "interactive" as const,
  };

  const credentialsBody = (
    <>
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.welcomeText}>{t("welcome")}</ThemedText>
        <ThemedText style={styles.subtitleText}>
          {t("login_to_workspace")}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={{ marginBottom: 6, alignSelf: isRTL ? "flex-end" : "flex-start" }}>
            {t("mobile_number")}
          </ThemedText>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
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
            <View style={{ flex: 1 }}>
              <CustomInput
                label=""
                placeholder={t("enter_your_mobile_number")}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 0 }}
                value={phone}
                onChangeText={(val) => {
                  setPhone(normalizePhoneDigits(val).slice(0, 12));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
              />
            </View>
          </View>
        </View>
        <CustomInput
          label={t("password")}
          placeholder={t("password")}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (errors.password)
              setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
        />

        <View
          style={[
            styles.rememberForgotRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Pressable
            onPress={() => setRememberMe((v) => !v)}
            style={styles.rememberMePressable}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
          >
            <Ionicons
              name={rememberMe ? "checkbox" : "square-outline"}
              size={22}
              color={rememberMe ? Colors.primary : Colors.text.secondary}
            />
            <ThemedText style={styles.rememberMeLabel}>{t("remember_me")}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push("/forgot-password" as never)
            }
            accessibilityRole="link"
          >
            <ThemedText style={styles.footerLink}>{t("forgot_password")}</ThemedText>
          </Pressable>
        </View>

        <CustomButton
          title={t("login")}
          onPress={() => void handleLogin()}
          style={styles.loginButton}
          isLoading={isLoading || isSendingLoginOtp}
        />

        <View
          style={[
            styles.footer,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.footerText}>
            {t("no_account_prompt")}
          </ThemedText>
          <Pressable onPress={() => router.push("/account-type")}>
            <ThemedText style={styles.footerLink}>{t("register")}</ThemedText>
          </Pressable>
        </View>
      </View>
    </>
  );

  const otpBody = (
    <>
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.welcomeText}>{t("verification_code")}</ThemedText>
        <ThemedText style={styles.subtitleText}>
          {t("otp_sent_to_phone")}
        </ThemedText>
      </View>

      <View style={styles.form}>
        {smsCanonicalPhone ? (
          <Text style={[styles.otpEmailStrong, { marginBottom: 12 }]}>
            {smsCanonicalPhone}
          </Text>
        ) : null}
        <OtpCodeInput
          label={t("otp_code_placeholder")}
          value={otpSms}
          error={errors.otpSms}
          onChangeDigits={(d) => {
            setOtpSms(d);
            if (errors.otpSms) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.otpSms;
                return next;
              });
            }
          }}
        />
        <CustomButton
          title={t("verify_and_continue")}
          onPress={() => void handleVerifyLoginPhoneOtp()}
          style={styles.loginButton}
          isLoading={isVerifyingLoginOtp}
        />
        <Pressable
          onPress={() => void handleResendLoginOtp()}
          disabled={isSendingLoginOtp}
          style={styles.otpForgotPwdPressable}
        >
          <ThemedText style={[styles.otpResendText, isSendingLoginOtp ? { opacity: 0.6 } : undefined]}>
            {t("resend_code")}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            setWizardStep("credentials");
            setOtpSms("");
            setSmsCanonicalPhone("");
            setErrors((prev) => {
              const next = { ...prev };
              delete next.otpSms;
              return next;
            });
          }}
          style={styles.otpForgotPwdPressable}
        >
          <ThemedText style={styles.footerLink}>{t("change_mobile_number")}</ThemedText>
        </Pressable>
      </View>
    </>
  );

  const body = wizardStep === "otp" ? otpBody : credentialsBody;

  return (
    <SafeAreaView style={styles.safeArea}>
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
