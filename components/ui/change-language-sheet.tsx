import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { storage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BACKDROP_DURATION, BOTTOM_SHEET_SPRING } from "./bottom-sheet-config";

export interface ChangeLanguageSheetRef {
  open: () => void;
  close: () => void;
}

interface LanguageOption {
  id: string;
  label: string;
  labelAr: string;
}

export const ChangeLanguageSheet = forwardRef<ChangeLanguageSheetRef>(
  (_, ref) => {
    const { t, i18n } = useTranslation();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const isRTL = i18n.language === "ar";

    const sheetHeight = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const [visible, setVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>(
      i18n.language
    );

    const languageOptions: LanguageOption[] = [
      { id: "ar", label: "Arabic", labelAr: "العربية" },
      { id: "en", label: "English", labelAr: "الانجليزية" },
    ];

    const open = useCallback(() => {
      setVisible(true);
      setSelectedLanguage(i18n.language);
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
      translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
    }, [translateY, backdropOpacity, i18n.language]);

    const close = useCallback(() => {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
      translateY.value = withSpring(
        sheetHeight.value || SCREEN_HEIGHT,
        BOTTOM_SHEET_SPRING,
        (finished) => {
          if (finished) {
            runOnJS(setVisible)(false);
          }
        }
      );
    }, [translateY, backdropOpacity, sheetHeight, SCREEN_HEIGHT]);

    const handleLanguageSelect = async (languageId: string) => {
      if (languageId === selectedLanguage) {
        close();
        return;
      }

      try {
        setSelectedLanguage(languageId);
        await storage.setItem("language", languageId);
        await i18n.changeLanguage(languageId);

        // Small delay to ensure storage is settled before restart
        setTimeout(() => {
          Updates.reloadAsync().catch((err) => {
            console.error("Reload failed:", err);
          });
        }, 500);
      } catch (error) {
        console.error("Failed to change language:", error);
        close();
      }
    };

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
      };
    });

    const LanguageItem = ({
      option,
      isSelected,
      onPress,
    }: {
      option: LanguageOption;
      isSelected: boolean;
      onPress: () => void;
    }) => (
      <TouchableOpacity
        style={[
          styles.languageItem,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.languageLabel,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {isRTL ? option.labelAr : option.label}
        </Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );

    return (
      <Modal
        transparent
        visible={visible}
        onRequestClose={close}
        animationType="none"
      >
        <GestureHandlerRootView style={styles.flex}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={styles.flex} onPress={close} />
          </Animated.View>
          <GestureDetector gesture={gesture}>
            <Animated.View
              onLayout={onLayout}
              style={[
                styles.container,
                { maxHeight: SCREEN_HEIGHT * 0.9 },
                animatedStyle,
              ]}
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
                  {t("language_settings")}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.content}>
                {languageOptions.map((option) => (
                  <LanguageItem
                    key={option.id}
                    option={option}
                    isSelected={selectedLanguage === option.id}
                    onPress={() => handleLanguageSelect(option.id)}
                  />
                ))}
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Modal>
    );
  }
);

ChangeLanguageSheet.displayName = "ChangeLanguageSheet";

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
    paddingBottom: 40,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: Colors.placeholder,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 20,
  },
  content: {
    paddingVertical: 10,
    gap: 20,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  languageLabel: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.primary,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.text.light,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxSelected: {
    backgroundColor: Colors.tagBg,
    borderColor: Colors.tagBg,
  },
});
