import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
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

export interface AddPaymentMethodSheetRef {
  open: () => void;
  close: () => void;
}

type PaymentType = "mastercard" | "jazzcash" | "visa";

export const AddPaymentMethodSheet = forwardRef<AddPaymentMethodSheetRef>(
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

    const [selectedPaymentType, setSelectedPaymentType] =
      useState<PaymentType>("visa");
    const [formData, setFormData] = useState({
      cardholderName: "",
      cardNumber: "",
      expirationDate: "",
      cvv: "",
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

    const formatCardNumber = (value: string) => {
      const cleaned = value.replace(/\s/g, "");
      const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
      return formatted.substring(0, 19); // 16 digits + 3 spaces
    };

    const formatExpirationDate = (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length >= 2) {
        return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
      }
      return cleaned;
    };

    const handleCardNumberChange = (value: string) => {
      const formatted = formatCardNumber(value);
      updateFormData("cardNumber", formatted);
    };

    const handleExpirationDateChange = (value: string) => {
      const formatted = formatExpirationDate(value);
      updateFormData("expirationDate", formatted);
    };

    const validate = () => {
      const newErrors: { [key: string]: string } = {};

      if (!formData.cardholderName) {
        newErrors.cardholderName = t("cardholder_name_required");
      }

      const cardNumberDigits = formData.cardNumber.replace(/\s/g, "");
      if (!cardNumberDigits) {
        newErrors.cardNumber = t("card_number_required");
      } else if (cardNumberDigits.length !== 16) {
        newErrors.cardNumber = t("card_number_invalid");
      }

      if (!formData.expirationDate) {
        newErrors.expirationDate = t("expiration_date_required");
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expirationDate)) {
        newErrors.expirationDate = t("expiration_date_invalid");
      }

      if (!formData.cvv) {
        newErrors.cvv = t("cvv_required");
      } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
        newErrors.cvv = t("cvv_invalid");
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const resetForm = useCallback(() => {
      setFormData({
        cardholderName: "",
        cardNumber: "",
        expirationDate: "",
        cvv: "",
      });
      setSelectedPaymentType("visa");
      setErrors({});
    }, []);

    const handleAdd = async () => {
      if (!validate()) {
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement API call to add payment method
        await new Promise((resolve) => setTimeout(resolve, 1000));

        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("payment_method_added"),
        });

        close();
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: error.message || t("something_went_wrong"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    const close = useCallback(() => {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
      translateY.value = withSpring(sheetHeight.value || SCREEN_HEIGHT, BOTTOM_SHEET_SPRING, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
          runOnJS(resetForm)();
        }
      });
    }, [SCREEN_HEIGHT, sheetHeight, resetForm]);

    const open = useCallback(() => {
      setVisible(true);
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
      translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
    }, []);

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    const onLayout = (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      sheetHeight.value = height;
    };

    const panGesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        if (event.translationY > 0) {
          translateY.value = context.value.y + event.translationY;
          backdropOpacity.value = Math.max(
            0,
            1 - event.translationY / SCREEN_HEIGHT
          );
        }
      })
      .onEnd((event) => {
        if (
          event.translationY > sheetHeight.value * 0.3 ||
          event.velocityY > 500
        ) {
          runOnJS(close)();
        } else {
          translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
          backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    const paymentTypes = [
      {
        id: "mastercard" as PaymentType,
        name: "MasterCard",
        icon: "card",
        color: "#EB001B",
      },
      {
        id: "jazzcash" as PaymentType,
        name: "Jazz Cash",
        icon: "wallet",
        color: "#FF6B00",
      },
      {
        id: "visa" as PaymentType,
        name: "VISA",
        icon: "card",
        color: "#1434CB",
      },
    ];

    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            disabled={isLoading}
          >
            <Animated.View
              style={[styles.backdrop, animatedBackdropStyle]}
              pointerEvents="none"
            />
          </Pressable>

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheetContainer,
                animatedSheetStyle,
                { paddingBottom: insets.bottom || 20 },
              ]}
              onLayout={onLayout}
            >
              <View style={styles.handleBar} />

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoid}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.title, { textAlign: "center" }]}>
                    {t("add_new_method")}
                  </Text>

                  {/* Payment Type Selection */}
                  <View
                    style={[
                      styles.paymentTypesContainer,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    {paymentTypes.map((type) => (
                      <Pressable
                        key={type.id}
                        style={[
                          styles.paymentTypeCard,
                          selectedPaymentType === type.id &&
                            styles.paymentTypeCardSelected,
                        ]}
                        onPress={() => setSelectedPaymentType(type.id)}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={32}
                          color={type.color}
                        />
                        <Text style={styles.paymentTypeName}>{type.name}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Input Fields */}
                  <CustomInput
                    label={t("cardholder_name")}
                    placeholder={t("cardholder_name_placeholder")}
                    value={formData.cardholderName}
                    onChangeText={(val) =>
                      updateFormData("cardholderName", val)
                    }
                    error={errors.cardholderName}
                    textContentType="creditCardName"
                    autoComplete="cc-name"
                    containerStyle={styles.input}
                  />

                  <CustomInput
                    label={t("card_number")}
                    placeholder=".... .... .... ...."
                    value={formData.cardNumber}
                    onChangeText={handleCardNumberChange}
                    error={errors.cardNumber}
                    keyboardType="numeric"
                    textContentType="creditCardNumber"
                    autoComplete="cc-number"
                    containerStyle={styles.input}
                  />

                  <View
                    style={[
                      styles.rowInputs,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <CustomInput
                      label={t("expiration_date")}
                      placeholder="MM/YY"
                      value={formData.expirationDate}
                      onChangeText={handleExpirationDateChange}
                      error={errors.expirationDate}
                      keyboardType="numeric"
                      textContentType="creditCardExpiration"
                      autoComplete="cc-exp"
                      containerStyle={{
                        flex: 1,
                        marginBottom: 0,
                        marginRight: isRTL ? 0 : 10,
                        marginLeft: isRTL ? 10 : 0,
                      }}
                    />

                    <CustomInput
                      label={t("cvv")}
                      placeholder="..."
                      value={formData.cvv}
                      onChangeText={(val) =>
                        updateFormData("cvv", val.replace(/\D/g, "").substring(0, 4))
                      }
                      error={errors.cvv}
                      keyboardType="numeric"
                      secureTextEntry
                      textContentType="creditCardSecurityCode"
                      autoComplete="cc-csc"
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                  </View>

                  <CustomButton
                    title={t("add")}
                    onPress={handleAdd}
                    style={styles.addButton}
                    loading={isLoading}
                  />
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  keyboardAvoid: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    marginBottom: 20,
  },
  paymentTypesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 12,
  },
  paymentTypeCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    minHeight: 100,
  },
  paymentTypeCardSelected: {
    borderColor: Colors.tagBg,
    backgroundColor: "#F8FCFD",
  },
  paymentTypeName: {
    fontSize: 12,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.tagBg,
    marginTop: 10,
  },
});

