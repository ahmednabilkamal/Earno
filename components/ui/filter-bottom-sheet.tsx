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
  ScrollView,
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

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FilterBottomSheetProps {
  onApply?: (status: string, isPublished?: boolean) => void;
  showPublishedFilter?: boolean; // Show published/not published filter for owners
  initialStatus?: string; // Pre-select this status when opening (e.g. current filter)
}

interface StatusOption {
  id: string;
  label: string;
}

export const FilterBottomSheet = forwardRef<
  FilterBottomSheetRef,
  FilterBottomSheetProps
>(({ onApply, showPublishedFilter = false, initialStatus = "all" }, ref) => {
  const { t, i18n } = useTranslation();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const isRTL = i18n.language === "ar";

  const sheetHeight = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const [visible, setVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedPublished, setSelectedPublished] = useState<boolean | undefined>(undefined);

  const statusOptions: StatusOption[] = [
    { id: "all", label: t("all") },
    { id: "approved", label: t("approved") },
    { id: "rejected", label: t("rejected") },
    { id: "pending", label: t("pending") },
    { id: "active", label: t("active") },
    { id: "completed", label: t("completed") },
  ];

  const open = useCallback(() => {
    setVisible(true);
    setSelectedStatus(initialStatus);
    backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
    translateY.value = withSpring(0, BOTTOM_SHEET_SPRING);
  }, [initialStatus, translateY, backdropOpacity]);

  const resetForm = useCallback(() => {
    setSelectedStatus("all");
    setSelectedPublished(undefined);
  }, []);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION * 0.85 });
    translateY.value = withSpring(sheetHeight.value || SCREEN_HEIGHT, BOTTOM_SHEET_SPRING, (finished) => {
      if (finished) {
        runOnJS(setVisible)(false);
        runOnJS(resetForm)();
      }
    });
  }, [translateY, backdropOpacity, sheetHeight, SCREEN_HEIGHT, resetForm]);

  const handleApply = () => {
    // Handle filter application here
    console.log("Selected status:", selectedStatus);
    console.log("Selected published:", selectedPublished);
    if (onApply) {
      onApply(selectedStatus, selectedPublished);
    }
    close();
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

  const CheckboxItem = ({
    option,
    isSelected,
    onPress,
  }: {
    option: StatusOption;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.checkboxItem,
        { flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color={Colors.white} />
        )}
      </View>
      <Text
        style={[
          styles.checkboxLabel,
          isSelected && styles.checkboxLabelSelected,
          isRTL ? { marginRight: 12 } : { marginLeft: 12 },
        ]}
      >
        {option.label}
      </Text>
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
                {t("filter")}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.content}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("project_status")}
                </Text>

                <View style={styles.checkboxContainer}>
                  {statusOptions.map((option) => (
                    <CheckboxItem
                      key={option.id}
                      option={option}
                      isSelected={selectedStatus === option.id}
                      onPress={() => setSelectedStatus(option.id)}
                    />
                  ))}
                </View>

                {showPublishedFilter && (
                  <>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { textAlign: isRTL ? "right" : "left", marginTop: 24 },
                      ]}
                    >
                      {t("published_status")}
                    </Text>

                    <View style={styles.checkboxContainer}>
                      <CheckboxItem
                        option={{ id: "all_published", label: t("all") }}
                        isSelected={selectedPublished === undefined}
                        onPress={() => setSelectedPublished(undefined)}
                      />
                      <CheckboxItem
                        option={{ id: "published", label: t("published") }}
                        isSelected={selectedPublished === true}
                        onPress={() => setSelectedPublished(true)}
                      />
                      <CheckboxItem
                        option={{ id: "not_published", label: t("not_published") }}
                        isSelected={selectedPublished === false}
                        onPress={() => setSelectedPublished(false)}
                      />
                    </View>
                  </>
                )}

                <CustomButton
                  title={t("apply")}
                  onPress={handleApply}
                  style={styles.applyButton}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
});

FilterBottomSheet.displayName = "FilterBottomSheet";

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
    // height: "95%",
  },
  flex: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoRegular,
    color: Colors.placeholder,
  },
  content: {
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.CairoMedium,
    color: Colors.text.primary,
    marginBottom: 15,
  },
  checkboxContainer: {
    gap: 12,
    marginBottom: 20,
  },
  checkboxItem: {
    alignItems: "center",
    paddingVertical: 2,
  },
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
    backgroundColor: Colors.tagBg,
    borderColor: Colors.tagBg,
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
  },
  checkboxLabelSelected: {
    color: Colors.tagBg,
    fontFamily: Fonts.CairoRegular,
  },
  applyButton: {
    marginTop: 10,
    backgroundColor: Colors.tagBg,
    height: 55,
    borderRadius: 12,
  },
});
