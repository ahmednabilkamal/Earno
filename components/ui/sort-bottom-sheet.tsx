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

export interface SortBottomSheetRef {
  open: () => void;
  close: () => void;
}

export type SortOptionId = "latest" | "price_asc" | "price_desc";

export interface SortValue {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS: { id: SortOptionId; sortBy: string; sortOrder: "asc" | "desc" }[] = [
  { id: "latest", sortBy: "created_at", sortOrder: "desc" },
  { id: "price_asc", sortBy: "investment_needed", sortOrder: "asc" },
  { id: "price_desc", sortBy: "investment_needed", sortOrder: "desc" },
];

interface SortBottomSheetProps {
  initialValue?: SortValue;
  onApply?: (value: SortValue) => void;
}

export const SortBottomSheet = forwardRef<SortBottomSheetRef, SortBottomSheetProps>(
  ({ initialValue, onApply }, ref) => {
    const { t, i18n } = useTranslation();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const isRTL = i18n.language === "ar";

    const sheetHeight = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const [visible, setVisible] = useState(false);
    const [selectedId, setSelectedId] = useState<SortOptionId>("latest");

    const open = useCallback(() => {
      setVisible(true);
      const match = SORT_OPTIONS.find(
        (o) =>
          o.sortBy === initialValue?.sortBy && o.sortOrder === initialValue?.sortOrder
      );
      setSelectedId(match?.id ?? "latest");
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
      translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
    }, [initialValue, translateY, backdropOpacity]);

    const close = useCallback(() => {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
      translateY.value = withSpring(sheetHeight.value || SCREEN_HEIGHT, BOTTOM_SHEET_SPRING, (finished) => {
        if (finished) runOnJS(setVisible)(false);
      });
    }, [translateY, backdropOpacity, sheetHeight, SCREEN_HEIGHT]);

    const getSortLabel = (id: SortOptionId) => {
      switch (id) {
        case "latest":
          return t("sort_latest");
        case "price_asc":
          return t("sort_price_low_high");
        case "price_desc":
          return t("sort_price_high_low");
        default:
          return t("sort_latest");
      }
    };

    const handleApply = () => {
      const opt = SORT_OPTIONS.find((o) => o.id === selectedId) ?? SORT_OPTIONS[0];
      if (onApply) onApply({ sortBy: opt.sortBy, sortOrder: opt.sortOrder });
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
                { maxHeight: SCREEN_HEIGHT * 0.45 },
                animatedStyle,
              ]}
            >
              <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
                  {t("sort_by")}
                </Text>
              </View>
              <View style={styles.content}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    onPress={() => setSelectedId(opt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selectedId === opt.id && styles.checkboxSelected]}>
                      {selectedId === opt.id && (
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedId === opt.id && styles.optionLabelSelected,
                        isRTL ? { marginRight: 12 } : { marginLeft: 12 },
                      ]}
                    >
                      {getSortLabel(opt.id)}
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
  }
);

SortBottomSheet.displayName = "SortBottomSheet";

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
