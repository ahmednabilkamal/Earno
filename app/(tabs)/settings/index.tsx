import {
  ChangeLanguageSheet,
  ChangeLanguageSheetRef,
} from "@/components/ui/change-language-sheet";
import {
  ChangePasswordSheet,
  ChangePasswordSheetRef,
} from "@/components/ui/change-password-sheet";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { ACCOUNT_DELETE_WEB_URL } from "@/constants/api";
import { Colors } from "@/constants/colors";
import { authService } from "@/services/auth-service";
import { expoPushTokenService } from "@/services/expo-push-token-service";
import { notificationService } from "@/services/notification-service";
import { useAuthStore } from "@/store/auth-store";
import { resolveProfilePhotoUrl } from "@/utils/profile-photo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import styles from "./styles";

const CustomSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const progress = useDerivedValue(() => {
    return withSpring(value ? 1 : 0, {
      damping: 20,
      stiffness: 150,
    });
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#E9E9EA", Colors.greenSwitch]
    );
    return {
      backgroundColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * 14 }],
    };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View
        style={[
          {
            width: 32,
            height: 18,
            borderRadius: 9,
            padding: 2,
            justifyContent: "center",
          },
          animatedContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 2,
            },
            animatedThumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationPrefLoading, setNotificationPrefLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const changePasswordSheetRef = useRef<ChangePasswordSheetRef>(null);
  const changeLanguageSheetRef = useRef<ChangeLanguageSheetRef>(null);

  const { user, logout, updateUser } = useAuthStore();

  const rawProfilePhoto = user?.avatar || user?.profile_photo_url;
  const profilePhotoUri = resolveProfilePhotoUrl(rawProfilePhoto);

  useEffect(() => {
    setProfilePhotoFailed(false);
  }, [rawProfilePhoto]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        if (response && response.user) {
          updateUser(response.user);
        }
      } catch (error) {
        console.error("Failed to fetch profile in settings:", error);
      }
    };

    fetchProfile();
  }, [updateUser]);

  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        setNotificationPrefLoading(true);
        const pref = await notificationService.getPreferences();
        setNotificationsEnabled(pref.push_notifications);
      } catch (error) {
        console.warn("Failed to load notification preferences:", error);
      } finally {
        setNotificationPrefLoading(false);
      }
    };

    loadNotificationPreference();
  }, []);

  const handleNotificationToggle = async (nextValue: boolean) => {
    if (notificationPrefLoading) return;
    const previous = notificationsEnabled;
    setNotificationsEnabled(nextValue);
    setNotificationPrefLoading(true);
    try {
      const pref = await notificationService.updatePreferences({
        push_notifications: nextValue,
      });
      setNotificationsEnabled(pref.push_notifications);
    } catch (error) {
      console.warn("Failed to update notification preferences:", error);
      setNotificationsEnabled(previous);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failed_to_update_preferences", {
          defaultValue: "Failed to update notification preference",
        }),
      });
    } finally {
      setNotificationPrefLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      // Best-effort: remove all Expo tokens for this user without requiring OS permission checks.
      try {
        await expoPushTokenService.remove();
      } catch (e) {
        console.warn("Failed to remove Expo push token(s):", e);
      }

      // Call API to invalidate the current token/session
      await authService.logout();
    } catch (error) {
      console.error("Failed to logout from API:", error);
      // Even if API logout fails, proceed with local logout to keep app state clean
    } finally {
      await logout();
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  const handleLanguageChange = () => {
    changeLanguageSheetRef.current?.open();
  };

  const handleDeleteAccount = () => {
    if (isDeletingAccount) return;
    setDeleteAccountPassword("");
    setDeleteAccountModalVisible(true);
  };

  const closeDeleteAccountModal = () => {
    setDeleteAccountModalVisible(false);
    setDeleteAccountPassword("");
  };

  const confirmDeleteAccount = () => {
    const pwd = deleteAccountPassword.trim();
    if (!pwd) return;
    void runDeleteAccount(pwd);
  };

  const canSubmitDeleteAccount =
    deleteAccountPassword.trim().length > 0 && !isDeletingAccount;

  const runDeleteAccount = async (password: string) => {
    setIsDeletingAccount(true);
    try {
      await authService.deleteAccount(password);
      await logout();
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("delete_account_success"),
      });
      closeDeleteAccountModal();
      router.replace("/login");
    } catch (error: any) {
      console.error("Delete account error:", error);
      const status = error?.response?.status;
      const canOpenWeb =
        typeof ACCOUNT_DELETE_WEB_URL === "string" &&
        ACCOUNT_DELETE_WEB_URL.startsWith("http");
      const msg =
        typeof error?.response?.data?.message === "string"
          ? error.response.data.message
          : undefined;
      Toast.show({
        type: "error",
        text1: t("delete_account_failed"),
        text2: msg || t("error"),
      });
      if (canOpenWeb && (status === 404 || status === 405 || status === 501)) {
        Alert.alert(
          t("delete_account_failed"),
          t("delete_account_failed_web_hint"),
          [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("open_in_browser"),
              onPress: () => Linking.openURL(ACCOUNT_DELETE_WEB_URL),
            },
          ]
        );
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const SettingRow = ({
    icon,
    label,
    onPress,
    showChevron = true,
    showSwitch = false,
    isLast = false,
    destructive = false,
    disabled = false,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    showChevron?: boolean;
    showSwitch?: boolean;
    isLast?: boolean;
    destructive?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionRow,
        { flexDirection: isRTL ? "row" : "row-reverse" },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      disabled={showSwitch || disabled}
      activeOpacity={0.7}
    >
      {showSwitch ? (
        <CustomSwitch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
        />
      ) : showChevron ? (
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={18}
          color={destructive ? Colors.red : Colors.placeholder}
        />
      ) : (
        <View style={{ width: 18 }} />
      )}

      <View
        style={[
          styles.optionLeft,
          { flexDirection: isRTL ? "row" : "row-reverse" },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            destructive && { color: Colors.red },
            { textAlign: isRTL ? "left" : "right" },
            isRTL ? { marginLeft: 10 } : { marginRight: 10 },
          ]}
        >
          {label}
        </Text>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={destructive ? Colors.red : Colors.placeholder}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientOverlay />
      <ScrollView
        style={styles.contentAbove}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={styles.headerTitle}>{t("settings")}</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#002347" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View
          style={[
            styles.profileSection,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {profilePhotoUri && !profilePhotoFailed ? (
            <Image
              source={{ uri: profilePhotoUri }}
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => setProfilePhotoFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.profileImage,
                {
                  backgroundColor: "#EEE",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
          <View
            style={[
              styles.profileInfo,
              isRTL ? { marginRight: 15 } : { marginLeft: 15 },
              { alignItems: isRTL ? "flex-end" : "flex-start" },
            ]}
          >
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={[styles.userEmail, { writingDirection: "ltr", textAlign: isRTL ? "right" : "left" }]}>
              {user?.phone ?? ""}
            </Text>
            {user?.user_type ? (
              <View
                style={[
                  styles.accountTypeBadge,
                  isRTL && { alignSelf: "flex-end" },
                ]}
              >
                <Text style={styles.accountTypeLabel}>
                  {user.user_type === "investor"
                    ? t("investor")
                    : user.user_type === "project_owner"
                      ? t("project_owner")
                      : user.user_type}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Personal Account Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("personal_account")}
          </Text>
          <View style={styles.optionsCard}>
            <SettingRow
              icon="account-edit-outline"
              label={t("change_account_data")}
              onPress={() => router.push("/(tabs)/profile")}
            />
            <SettingRow
              icon="key-outline"
              label={t("change_password")}
              onPress={() => changePasswordSheetRef.current?.open()}
            />
            <SettingRow
              icon="account-remove-outline"
              label={
                isDeletingAccount ? t("loading") : t("delete_account")
              }
              onPress={handleDeleteAccount}
              isLast={true}
              destructive
              disabled={isDeletingAccount}
            />
          </View>
        </View>

        {/* Notifications Section */}
        {/* <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("notifications_and_alerts")}
          </Text>
          <View style={styles.optionsCard}>
            <SettingRow
              icon="bell-outline"
              label={t("enable_disable_notifications")}
              showChevron={false}
              showSwitch={true}
              isLast={true}
            />
          </View>
        </View> */}

        {/* Language Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("language_and_preferences")}
          </Text>
          <View style={styles.optionsCard}>
            <SettingRow
              icon="translate"
              label={i18n.language === "ar" ? t("arabic") : t("english")}
              onPress={handleLanguageChange}
              isLast={true}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("support_and_help")}
          </Text>
          <View style={styles.optionsCard}>
            <SettingRow
              icon="ticket-outline"
              label={t("technical_support")}
              onPress={() => router.push("/my-tickets")}
            />

            <SettingRow
              icon="key-outline"
              label={t("contact_customer_service")}
              onPress={() => router.push("/contact-support")}
            />

            <SettingRow
              icon="key-outline"
              label={t("faqs")}
              onPress={() => router.push("/faqs")}
            />

            <SettingRow
              icon="key-outline"
              label={t("report_problem")}
              onPress={() => router.push("/report-problem")}
              isLast={true}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("about_app")}
          </Text>
          <View style={styles.optionsCard}>
            <SettingRow
              icon="key-outline"
              label={t("terms_and_privacy")}
              onPress={() => router.push("/terms-and-privacy")}
              isLast={true}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutContainer,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoggingOut}
        >
          <MaterialCommunityIcons name="logout" size={24} color={Colors.red} />
          <Text
            style={[
              styles.logoutText,
              isRTL ? { marginRight: 10 } : { marginLeft: 10 },
            ]}
          >
            {isLoggingOut ? t("loading") : t("logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ChangePasswordSheet ref={changePasswordSheetRef} />
      <ChangeLanguageSheet ref={changeLanguageSheetRef} />

      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingAccount) closeDeleteAccountModal();
        }}
      >
        <Pressable
          style={styles.deleteModalBackdrop}
          onPress={() => {
            if (!isDeletingAccount) closeDeleteAccountModal();
          }}
        >
          <Pressable style={styles.deleteModalCard} onPress={(e) => e.stopPropagation()}>
            <Text
              style={[
                styles.deleteModalTitle,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("delete_account_confirm_title")}
            </Text>
            <Text
              style={[
                styles.deleteModalMessage,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("delete_account_confirm_message")}
            </Text>
            <Text
              style={[
                styles.deleteModalPasswordLabel,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {`${t("delete_account_password_label")} *`}
            </Text>
            <TextInput
              style={[
                styles.deleteModalPasswordInput,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={deleteAccountPassword}
              onChangeText={setDeleteAccountPassword}
              placeholder={t("delete_account_password_placeholder")}
              placeholderTextColor={Colors.inputPlaceholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
              importantForAutofill="no"
              editable={!isDeletingAccount}
            />
            <View
              style={[
                styles.deleteModalActions,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalBtnCancel]}
                onPress={closeDeleteAccountModal}
                disabled={isDeletingAccount}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteModalBtnCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalBtn,
                  styles.deleteModalBtnDelete,
                  !canSubmitDeleteAccount && !isDeletingAccount && styles.deleteModalBtnDeleteDisabled,
                ]}
                onPress={confirmDeleteAccount}
                disabled={!canSubmitDeleteAccount}
                activeOpacity={0.85}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color={Colors.red} size="small" />
                ) : (
                  <Text style={styles.deleteModalBtnDeleteText}>{t("delete")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
