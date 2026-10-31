import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { CustomButton } from "./custom-button";
import CustomInput from "./custom-input";
import { BACKDROP_DURATION, BOTTOM_SHEET_SPRING } from "./bottom-sheet-config";

export interface ChangePasswordSheetRef {
  open: () => void;
  close: () => void;
}

export const ChangePasswordSheet = forwardRef<ChangePasswordSheetRef>(
  (_, ref) => {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const isRTL = i18n.language === "ar";

    const sheetHeight = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user, token } = useAuthStore();

    const [formData, setFormData] = useState({
      current_password: "",
      password: "",
      password_confirmation: "",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    const validate = () => {
      const newErrors: { [key: string]: string } = {};

      if (!formData.current_password) {
        newErrors.current_password = t("current_password_required");
      }

      if (!formData.password) {
        newErrors.password = t("password_required");
      } else if (formData.password.length < 8) {
        newErrors.password = t("password_too_short");
      } else if (!/[a-zA-Z]/.test(formData.password)) {
        newErrors.password = t("password_must_contain_letter");
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = t("passwords_dont_match");
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async () => {
      if (!validate()) return;

      setIsLoading(true);
      try {
        const payload = {
          current_password: formData.current_password,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        };

        await authService.changePassword(payload);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("password_changed_success"),
        });
        close();
      } catch (error: any) {
        console.error("Change password error:", error);
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error.response?.data?.message || t("password_change_failed"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    const resetForm = useCallback(() => {
      setFormData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});
    }, []);

    const open = useCallback(() => {
      setVisible(true);
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
      translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
    }, [translateY, backdropOpacity]);

    const close = useCallback(() => {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
      translateY.value = withSpring(sheetHeight.value || SCREEN_HEIGHT, BOTTOM_SHEET_SPRING, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
          runOnJS(resetForm)();
        }
      });
    }, [translateY, backdropOpacity, sheetHeight, SCREEN_HEIGHT, resetForm]);

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = Math.max(0, context.value.y + event.translationY);
      })
      .onEnd((event) => {
        if (event.translationY > 100 || event.velocityY > 500) {
          runOnJS(close)();
        } else {
          translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
        }
      });

    const onLayout = (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      // Just capture the sheet height once; let the open/close
      // animations control translateY so it doesn't get pushed off-screen.
      if (height > 0 && sheetHeight.value === 0) {
        sheetHeight.value = height;
      }
    };

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
      };
    });

    const backdropStyle = useAnimatedStyle(() => {
      return {
        opacity: backdropOpacity.value,
        display: backdropOpacity.value === 0 ? "none" : "flex",
      };
    });

    return (
      <Modal
        transparent
        visible={visible}
        onRequestClose={close}
        animationType="none"
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.flex} onPress={close} />
        </Animated.View>
        <GestureDetector gesture={gesture}>
          <Animated.View
            onLayout={onLayout}
            style={[
              styles.container,
              { paddingBottom: Math.max(insets.bottom, 20) + 10 },
              { maxHeight: SCREEN_HEIGHT * 0.9 },
              animatedStyle,
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.flex}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View
                  style={[
                    styles.header,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <Text
                    style={[
                      styles.title,
                      { textAlign: isRTL ? "right" : "left", width: "100%" },
                    ]}
                  >
                    {t("edit_password")}
                  </Text>
                </View>

                <View style={styles.content}>
                  <CustomInput
                    label={t("current_password")}
                    placeholder={t("enter_current_password")}
                    containerStyle={styles.input}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="current-password"
                    value={formData.current_password}
                    onChangeText={(val) => updateFormData("current_password", val)}
                    error={errors.current_password}
                  />

                  <CustomInput
                    label={t("new_password")}
                    placeholder={t("enter_password")}
                    containerStyle={styles.input}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="new-password"
                    value={formData.password}
                    onChangeText={(val) => updateFormData("password", val)}
                    error={errors.password}
                  />

                  <CustomInput
                    label={t("confirm_password")}
                    placeholder={t("confirm_password_placeholder")}
                    containerStyle={styles.input}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="new-password"
                    value={formData.password_confirmation}
                    onChangeText={(val) =>
                      updateFormData("password_confirmation", val)
                    }
                    error={errors.password_confirmation}
                  />

                  <View style={styles.buttonWrapper}>
                    <CustomButton
                      title={t("update")}
                      onPress={handleUpdate}
                      style={styles.updateButton}
                      isLoading={isLoading}
                    />
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </Modal>
    );
  }
);

ChangePasswordSheet.displayName = "ChangePasswordSheet";

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 1001,
    paddingHorizontal: 20,
    paddingTop: 10,
    // height: "60%",
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoRegular,
    color: Colors.placeholder,
    textAlign: "right",
    width: "100%",
  },
  content: {
    gap: 15,
    marginTop: 10,
  },
  userInfoContainer: {
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  userInfoLabel: {
    fontSize: 12,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.light,
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 14,
    fontFamily: Fonts.AlmaraiBold,
    color: Colors.placeholder,
  },
  input: {
    marginBottom: 0,
  },
  buttonWrapper: {
    marginTop: 10,
    paddingBottom: 5,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 12,
  },
});
