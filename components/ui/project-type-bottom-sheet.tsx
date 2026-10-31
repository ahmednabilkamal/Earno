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
import { CustomButton } from "./custom-button";
import { BACKDROP_DURATION, BOTTOM_SHEET_SPRING } from "./bottom-sheet-config";

export interface ProjectTypeBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface Option {
  id: string;
  label: string;
}

interface ProjectTypeBottomSheetProps {
  initialValue?: string;
  onApply?: (projectType: string) => void;
}

export const ProjectTypeBottomSheet = forwardRef<
  ProjectTypeBottomSheetRef,
  ProjectTypeBottomSheetProps
>(({ initialValue = "all", onApply }, ref) => {
  const { t, i18n } = useTranslation();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const isRTL = i18n.language === "ar";

  const sheetHeight = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string>(initialValue);

  const options: Option[] = [
    { id: "all", label: t("all") },
    { id: "commercial", label: t("project_type_commercial") },
    { id: "real_estate", label: t("project_type_real_estate") },
    { id: "investor_seeking", label: t("project_type_investor_seeking") },
  ];

  const open = useCallback(() => {
    setVisible(true);
    setSelected(initialValue);
    backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
    translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
  }, [initialValue, translateY, backdropOpacity]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
    translateY.value = withSpring(sheetHeight.value || SCREEN_HEIGHT, BOTTOM_SHEET_SPRING, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }, [translateY, backdropOpacity, sheetHeight, SCREEN_HEIGHT]);

  const handleApply = () => {
    if (onApply) onApply(selected);
    close();
  };

  useImperativeHandle(ref, () => ({ open, close }));

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
    if (height > 0 && sheetHeight.value === 0) sheetHeight.value = height;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

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
              { maxHeight: SCREEN_HEIGHT * 0.5 },
              animatedStyle,
            ]}
          >
            <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
                {t("project_type")}
              </Text>
            </View>
            <View style={styles.content}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  onPress={() => setSelected(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selected === opt.id && styles.checkboxSelected]}>
                    {selected === opt.id && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected === opt.id && styles.optionLabelSelected,
                      isRTL ? { marginRight: 12 } : { marginLeft: 12 },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <CustomButton
              title={t("apply")}
              onPress={handleApply}
              style={styles.applyButton}
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
});

ProjectTypeBottomSheet.displayName = "ProjectTypeBottomSheet";

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
    paddingTop: 16,
    paddingBottom: 40,
  },
  flex: { flex: 1 },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
  },
  content: { paddingVertical: 16, gap: 4 },
  optionRow: { alignItems: "center", paddingVertical: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.text.light,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontFamily: Fonts.CairoMedium,
  },
  applyButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 12,
  },
});
