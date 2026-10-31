import { ThemedText } from "@/components/themed-text";
import { AuthBackButton } from "@/components/ui/auth-back-button";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import AppInput from "@/components/ui/custom-input";
import { OtpCodeInput } from "@/components/ui/otp-code-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { API_CONFIG } from "@/constants/api";
import { authService } from "@/services/auth-service";
import {
  getDeviceDisplayName,
  registerForPushNotificationsAsync,
} from "@/services/push-notification-service";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/utils/api";
import {
  isValidSaudiMobile,
  normalizePhoneDigits,
  toSaudiNationalPhone,
} from "@/utils/saudi-phone";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import styles from "./styles";

type WizardStep = "phone" | "otp" | "form";

interface CityDto {
  id: number;
  name: string;
  name_ar?: string | null;
}

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    phoneCode: "+966",
    city: "",
    country: "SA",
    user_type: (params.user_type as string) || "investor",
    password: "",
    confirmPassword: "",
  });

  const [wizardStep, setWizardStep] = useState<WizardStep>("phone");
  const [smsCanonicalPhone, setSmsCanonicalPhone] = useState("");
  const [phoneRegistrationToken, setPhoneRegistrationToken] = useState("");
  const [otpSms, setOtpSms] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);

  const [cities, setCities] = useState<CityDto[]>([]);

  useEffect(() => {
    if (params.user_type) {
      setFormData((prev) => ({
        ...prev,
        user_type: params.user_type as string,
      }));
    }
  }, [params.user_type]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingNationalPhone, setPendingNationalPhone] = useState("");
  const [pendingPhoneCode, setPendingPhoneCode] = useState("+966");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpSource, setOtpSource] = useState<"register" | "login">("register");

  const getParam = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] || "" : value || "";

  useEffect(() => {
    const otpEmail = getParam(params.otp_email as string | string[] | undefined);
    const source = getParam(params.otp_source as string | string[] | undefined);
    if (otpEmail) {
      setPendingEmail(otpEmail);
      setPendingPassword("");
      setOtpCode("");
      setIsOtpStep(true);
      setOtpSource(source === "login" ? "login" : "register");
    }
  }, [params.otp_email, params.otp_source]);

  useEffect(() => {
    if (wizardStep !== "form" || formData.user_type !== "investor") return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.get(API_CONFIG.ENDPOINTS.CITIES);
        const list = (res.data?.data ??
          res.data?.cities ??
          []) as CityDto[];
        if (!cancelled) setCities(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wizardStep, formData.user_type]);

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const toggleAcceptedTerms = () => {
    setAcceptedTerms((prev) => {
      const next = !prev;
      if (next && errors.acceptedTerms) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors.acceptedTerms;
          return newErrors;
        });
      }
      return next;
    });
  };

  const countries = useMemo(
    () => [{ label: t("country_saudi_arabia"), value: "SA" }],
    [t],
  );

  const phoneCodes = useMemo(
    () => [
      { label: "🇸🇦 +966", value: "+966" },
      { label: "🇪🇬 +20", value: "+20" },
      { label: "🇦🇪 +971", value: "+971" },
      { label: "🇰🇼 +965", value: "+965" },
      { label: "🇶🇦 +974", value: "+974" },
      { label: "🇧🇭 +973", value: "+973" },
      { label: "🇴🇲 +968", value: "+968" },
    ],
    [],
  );

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
  const termsContent = isRTL ? termsContentAr : termsContentEn;

  const mapApiErrorToTranslationKey = (field: string, message: string): string => {
    const msg = message.toLowerCase();
    const fieldMap: Record<string, Record<string, string>> = {
      phone_registration_token: {
        expired: "phone_verification_invalid",
        invalid: "phone_verification_invalid",
      },
      city: {
        required: "city_required",
        "field is required": "city_required",
        selected: "city_invalid",
        invalid: "city_invalid",
      },
      name: { required: "name_required", "field is required": "name_required", max: "name_too_long" },
      email: {
        required: "email_required",
        valid: "email_invalid",
        unique: "email_already_registered",
        "already registered": "email_already_registered",
      },
      phone: {
        required: "phone_required",
        "field is required": "phone_required",
        invalid: "phone_invalid",
        unique: "phone_already_registered",
        "already registered": "phone_already_registered",
      },
      password: {
        required: "password_required",
        "field is required": "password_required",
        "at least 8": "password_too_short",
        "8 characters": "password_too_short",
        letter: "password_must_contain_letter",
        number: "password_must_contain_number",
        numbers: "password_must_contain_number",
        confirmed: "passwords_dont_match",
        "does not match": "passwords_dont_match",
      },
      password_confirmation: { "does not match": "passwords_dont_match", confirmed: "passwords_dont_match" },
      user_type: { required: "user_type_required", "field is required": "user_type_required", in: "user_type_invalid" },
      country: { required: "country_required", "field is required": "country_required" },
      otp: { invalid: "otp_verification_failed" },
    };
    const keys = fieldMap[field];
    if (!keys) return message;
    for (const [pattern, key] of Object.entries(keys)) {
      if (msg.includes(pattern)) return key;
    }
    return message;
  };

  const parseApiValidationErrors = (apiErrors: Record<string, string[]>) => {
    const fieldMap: Record<string, string> = {
      password_confirmation: "confirmPassword",
    };
    const newErrors: { [key: string]: string } = {};
    for (const [field, messages] of Object.entries(apiErrors)) {
      if (messages?.length) {
        const formField = fieldMap[field] || field;
        const key = mapApiErrorToTranslationKey(field, messages[0]);
        newErrors[formField] = t(key, { defaultValue: messages[0] });
      }
    }
    return newErrors;
  };

  const nationalDigitsForApi = (rawPhone: string) => toSaudiNationalPhone(rawPhone);

  const validatePhoneWizard = () => {
    const e: Record<string, string> = {};
    if (!isValidSaudiMobile(formData.phone)) {
      e.phone = t("enter_valid_mobile_short");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSmsOtpStep = () => {
    const e: Record<string, string> = {};
    if (!otpSms || otpSms.length !== 6) {
      e.otpSms = t("enter_six_digit_sms_code");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateFinalForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) newErrors.name = t("name_required");

    const em = formData.email.trim();
    if (em && !/\S+@\S+\.\S+/.test(em)) {
      newErrors.email = t("email_invalid");
    }

    if (formData.user_type === "investor" && !formData.city) {
      newErrors.city = t("city_required");
    }

    if (!formData.country) newErrors.country = t("country_required");

    if (!formData.password) {
      newErrors.password = t("password_required");
    } else if (formData.password.length < 8) {
      newErrors.password = t("password_too_short");
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      newErrors.password = t("password_must_contain_letter");
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = t("password_must_contain_number");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("passwords_dont_match");
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = t("accept_terms_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendPhoneOtp = async () => {
    if (!validatePhoneWizard()) return;
    setIsSendingSms(true);
    try {
      const res = await authService.sendPhoneOtp(formData.phone, formData.phoneCode, "registration");
      setSmsCanonicalPhone((res.phone as string) ?? "");
      setWizardStep("otp");
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("otp_sent_to_phone"),
      });
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const apiErrors = axiosErr.response?.data?.errors;
      if (apiErrors?.phone?.[0]) {
        setErrors((prev) => ({ ...prev, phone: t("phone_already_registered", { defaultValue: apiErrors.phone[0] }) }));
      }
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          (apiErrors?.phone?.[0] ? t("phone_already_registered") : axiosErr.response?.data?.message) ||
          t("could_not_send_sms"),
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!validateSmsOtpStep()) return;
    setIsVerifyingSms(true);
    try {
      const res = await authService.verifyPhoneOtp(
        formData.phone,
        otpSms,
        formData.phoneCode,
        "registration"
      );
      const proof = res.phone_registration_token;
      if (!proof) {
        throw new Error("missing_token");
      }
      setPhoneRegistrationToken(proof);
      const digits = nationalDigitsForApi(formData.phone);
      setPendingNationalPhone(digits);
      setPendingPhoneCode(formData.phoneCode);
      setWizardStep("form");
      Toast.show({
        type: "success",
        text1: t("success"),
        text2:
          t("phone_verified"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("otp_verification_failed"),
      });
    } finally {
      setIsVerifyingSms(false);
    }
  };

  const handleFinalRegister = async () => {
    if (!validateFinalForm()) return;
    setIsLoading(true);
    try {
      const expoToken = await registerForPushNotificationsAsync();
      const deviceName = getDeviceDisplayName();

      const national = nationalDigitsForApi(formData.phone);
      const payload: Record<string, unknown> = {
        name: formData.name,
        phone: national,
        phone_code: formData.phoneCode,
        user_type: formData.user_type,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        phone_registration_token: phoneRegistrationToken,
        country: formData.country,
      };

      const emTrim = formData.email.trim();
      if (emTrim) payload.email = emTrim;
      if (formData.user_type === "investor") {
        payload.city = formData.city;
      }

      const response = await authService.register(payload, expoToken, deviceName);

      if (response.user && response.token) {
        await setAuth(response.user, response.token);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("registration_success"),
        });
        if (formData.user_type === "investor") {
          router.replace("/investor-onboarding");
        } else {
          router.replace("/home");
        }
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const axiosErr = error as { response?: { data?: { errors?: unknown; message?: string } } };
      const apiErrors = axiosErr.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const parsedErrors = parseApiValidationErrors(apiErrors as Record<string, string[]>);
        setErrors(parsedErrors);
        const firstError = Object.values(parsedErrors)[0];
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: firstError || t("validation_failed"),
        });
      } else {
        const msg =
          typeof axiosErr.response?.data?.message === "string"
            ? axiosErr.response.data.message
            : t("registration_failed");
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: msg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!pendingEmail) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enter_valid_otp"),
      });
      return;
    }
    if (otpCode.length !== 6) {
      setErrors((prev) => ({
        ...prev,
        otpCode: t("enter_six_digit_sms_code"),
      }));
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("enter_valid_otp"),
      });
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.otpCode;
      return next;
    });

    setIsVerifyingOtp(true);
    try {
      await authService.verifyEmailOtp(pendingEmail, otpCode);

      if (pendingPassword && pendingNationalPhone) {
        const loginResponse = await authService.login(
          pendingNationalPhone,
          pendingPassword,
          undefined,
          undefined,
          pendingPhoneCode
        );
        await setAuth(loginResponse.user, loginResponse.token);
      }

      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("email_verified_success"),
      });

      if (!pendingPassword || otpSource === "login") {
        router.replace("/login");
      } else if (formData.user_type === "investor") {
        router.replace("/investor-onboarding");
      } else {
        router.replace("/home");
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          axiosErr.response?.data?.message ||
          t("otp_verification_failed"),
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) return;

    setIsResendingOtp(true);
    try {
      await authService.sendEmailOtp(pendingEmail);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("otp_resent"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("otp_resend_failed"),
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleBack = () => {
    if (isOtpStep) {
      if (otpSource === "login") {
        router.replace("/login" as never);
        return;
      }

      setIsOtpStep(false);
      return;
    }

    if (wizardStep === "form") {
      setWizardStep("otp");
      return;
    }

    if (wizardStep === "otp") {
      setWizardStep("phone");
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/account-type" as never);
  };

  const scrollProps = {
    style: styles.contentAbove,
    contentContainerStyle: styles.scrollContent,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    keyboardDismissMode: "interactive" as const,
  };

  const cityOptions = cities.map((c) => ({
    label: isRTL && c.name_ar ? c.name_ar : c.name,
    value: c.name,
  }));

  let bodyInner: React.ReactNode;

  if (isOtpStep) {
    bodyInner = (
      <View style={styles.form}>
        <View style={styles.otpCard}>
          <ThemedText style={styles.otpEmailText}>{t("otp_sent_to")}</ThemedText>
          <ThemedText style={styles.otpEmailStrong}>{pendingEmail}</ThemedText>

          <OtpCodeInput
            label={t("verification_code")}
            placeholder={t("otp_code_placeholder")}
            value={otpCode}
            containerStyle={styles.otpInputContainer}
            error={errors.otpCode}
            onChangeDigits={(d) => {
              setOtpCode(d);
              if (errors.otpCode) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.otpCode;
                  return next;
                });
              }
            }}
          />

          <CustomButton
            title={t("verify_and_continue")}
            onPress={() => void handleVerifyEmailOtp()}
            style={styles.loginButton}
            isLoading={isVerifyingOtp}
          />

          <Pressable
            onPress={() => void handleResendOtp()}
            style={styles.otpResendLink}
            disabled={isResendingOtp}
          >
            <ThemedText style={styles.otpResendText}>
              {isResendingOtp ? t("loading") : t("resend_code")}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() =>
              otpSource === "login"
                ? router.replace("/login" as never)
                : setIsOtpStep(false)
            }
            style={styles.otpEditLink}
          >
            <ThemedText style={styles.otpEditText}>
              {otpSource === "login"
                ? t("back_to_login")
                : t("edit_registration_email")}
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.otpForgotPwdPressable}
            onPress={() =>
              router.push({
                pathname: "/forgot-password",
              } as never)
            }
            accessibilityRole="link"
          >
            <ThemedText style={styles.otpForgotPwdText}>{t("forgot_password")}</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  } else if (wizardStep === "phone") {
    bodyInner = (
      <View style={styles.form}>
        <ThemedText style={{ ...styles.subtitleText, marginBottom: 16 }}>
          {t("sms_register_step_phone")}
        </ThemedText>
        <AppInput
          label={t("phone_number")}
          placeholder={t("enter_your_mobile_number")}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(val) => updateFormData("phone", normalizePhoneDigits(val).slice(0, 12))}
          error={errors.phone}
          leftComponent={
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
              }}
            >
              <CustomDropdown
                label=""
                placeholder=""
                options={phoneCodes}
                onSelect={(val) => updateFormData("phoneCode", val)}
                selectedValue={formData.phoneCode}
                containerStyle={{ marginBottom: 0, width: 100 }}
                triggerStyle={{ paddingHorizontal: 8, borderRadius: 8 }}
                hideLabel
              />
              <View style={{ width: 1, height: 30, backgroundColor: "#E0E0E0", marginHorizontal: 10 }} />
            </View>
          }
        />
        <CustomButton
          title={t("send_verification_code")}
          onPress={() => void handleSendPhoneOtp()}
          style={styles.loginButton}
          isLoading={isSendingSms}
        />
        <Pressable onPress={() => router.replace("/login" as never)} style={styles.otpForgotPwdPressable}>
          <ThemedText style={styles.otpResendText}>{t("login")}</ThemedText>
        </Pressable>
      </View>
    );
  } else if (wizardStep === "otp") {
    bodyInner = (
      <View style={styles.form}>
        <ThemedText style={{ marginBottom: 8 }}>{t("verification_code")}</ThemedText>
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
          onPress={() => void handleVerifyPhoneOtp()}
          style={styles.loginButton}
          isLoading={isVerifyingSms}
        />
        <Pressable
          onPress={() => setWizardStep("phone")}
          style={styles.otpForgotPwdPressable}
        >
          <ThemedText style={styles.otpResendText}>
            {t("change_mobile_number")}
          </ThemedText>
        </Pressable>
      </View>
    );
  } else {
    bodyInner = (
      <View style={styles.form}>
        {smsCanonicalPhone ? (
          <View style={{ padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: "rgba(15,139,138,0.08)" }}>
            <ThemedText style={{ fontSize: 13 }}>{t("verified_mobile_prefix")}</ThemedText>
            <Text style={[styles.subtitleText, { fontWeight: "700", fontSize: 15 }]}>
              {smsCanonicalPhone}
            </Text>
          </View>
        ) : null}
        <AppInput
          label={t("full_name")}
          placeholder={t("full_name")}
          textContentType="name"
          autoComplete="name"
          value={formData.name}
          onChangeText={(val) => updateFormData("name", val)}
          error={errors.name}
        />
        <AppInput
          label={`${t("email_address")} (${t("optional")})`}
          placeholder={t("email_address")}
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(val) => updateFormData("email", val)}
          autoCapitalize="none"
          error={errors.email}
        />

        {formData.user_type === "investor" ? (
          <CustomDropdown
            label={t("city")}
            placeholder={t("select_city")}
            options={cityOptions.length ? cityOptions : [{ label: "—", value: "" }]}
            onSelect={(val) => updateFormData("city", val)}
            selectedValue={formData.city}
            error={errors.city}
          />
        ) : null}

        <CustomDropdown
          label={t("country")}
          placeholder={t("select_country")}
          options={countries}
          onSelect={(val) => updateFormData("country", val)}
          selectedValue={formData.country}
          error={errors.country}
        />

        <AppInput
          label={t("password")}
          placeholder={t("password")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          value={formData.password}
          onChangeText={(val) => updateFormData("password", val)}
          error={errors.password}
        />
        <AppInput
          label={t("confirm_password")}
          placeholder={t("confirm_password")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChangeText={(val) => updateFormData("confirmPassword", val)}
          error={errors.confirmPassword}
        />
        <View style={styles.termsSection}>
          <View
            style={[
              styles.termsRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Pressable
              onPress={toggleAcceptedTerms}
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
            >
              {acceptedTerms ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : null}
            </Pressable>
            <Text
              style={[
                styles.termsText,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("register_terms_prefix")}{" "}
              <Text style={styles.termsLink} onPress={() => setTermsModalVisible(true)}>
                {t("terms_and_privacy")}
              </Text>
            </Text>
          </View>
          {errors.acceptedTerms ? (
            <Text
              style={[
                styles.termsError,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {errors.acceptedTerms}
            </Text>
          ) : null}
        </View>

        <CustomButton
          title={t("register")}
          onPress={() => void handleFinalRegister()}
          style={styles.loginButton}
          isLoading={isLoading}
        />

        <View
          style={[
            styles.secondaryAuthFooter,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.otpEmailText}>{t("already_have_account")} </ThemedText>
          <Pressable
            onPress={() => router.replace("/login" as never)}
            style={styles.secondaryAuthLinkPressable}
            accessibilityRole="link"
          >
            <ThemedText style={styles.otpResendText}>{t("login")}</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  const body = (
    <>
      <AuthBackButton
        isRTL={isRTL}
        label={t("go_back")}
        onPress={handleBack}
      />

      <View style={styles.header}>
        <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        <ThemedText style={styles.welcomeText}>{t("welcome")}</ThemedText>
        <ThemedText style={styles.subtitleText}>
          {isOtpStep ? t("otp_verify_subtitle") : t("login_to_workspace")}
        </ThemedText>
      </View>
      {bodyInner}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientOverlay />
      {Platform.OS === "web" ? (
        <ScrollView {...scrollProps}>{body}</ScrollView>
      ) : (
        <KeyboardAwareScrollView
          {...scrollProps}
          bottomOffset={16}
          extraKeyboardSpace={12}
        >
          {body}
        </KeyboardAwareScrollView>
      )}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalCard}>
            <View style={[styles.termsModalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[styles.termsModalTitle, { textAlign: isRTL ? "right" : "left" }]}>
                {t("terms_and_privacy")}
              </Text>
              <TouchableOpacity
                onPress={() => setTermsModalVisible(false)}
                style={styles.termsModalCloseBtn}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.termsModalScroll}
              contentContainerStyle={styles.termsModalContent}
              showsVerticalScrollIndicator={false}
            >
              {termsContent.map((paragraph, index) => (
                <Text
                  key={`terms-${index}`}
                  style={[styles.termsModalParagraph, { textAlign: isRTL ? "right" : "left" }]}
                >
                  {paragraph}
                </Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
