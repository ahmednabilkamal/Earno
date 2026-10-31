import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import {
  PROJECT_REPORT_REASONS,
  ProjectReportReason,
} from "@/services/report-service";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";

type ReportProjectModalProps = {
  visible: boolean;
  isRTL: boolean;
  reportReason: ProjectReportReason;
  reportDescription: string;
  reportSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onReasonChange: (reason: ProjectReportReason) => void;
  onDescriptionChange: (value: string) => void;
};

export function ReportProjectModal({
  visible,
  isRTL,
  reportReason,
  reportDescription,
  reportSubmitting,
  onClose,
  onSubmit,
  onReasonChange,
  onDescriptionChange,
}: ReportProjectModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [actionsHeight, setActionsHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const androidKeyboardOffset =
    Platform.OS === "android"
      ? Math.max(0, keyboardHeight - insets.bottom)
      : 0;
  const actionsBottomPadding = Math.max(insets.bottom, 22);

  const maxSheetHeight = Math.max(
    320,
    Math.min(
      screenHeight * 0.82,
      screenHeight - insets.top - 12 - androidKeyboardOffset
    )
  );

  // Constrain scroll area so it never stretches to fill empty sheet space.
  // 29 = handle bar (5) + handle marginBottom (12) + sheet paddingTop (12)
  const scrollMaxHeight = Math.max(
    160,
    maxSheetHeight - Math.max(actionsHeight, 30) 
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={reportModalStyles.backdrop}>
        <Pressable
          style={reportModalStyles.backdropPressArea}
          onPress={handleClose}
        />

        <View
          pointerEvents="box-none"
          style={[
            reportModalStyles.sheetHost,
            { bottom: androidKeyboardOffset },
          ]}
        >
          <Pressable
            style={[
              reportModalStyles.sheet,
              {
                maxHeight: maxSheetHeight,
              },
            ]}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <View style={reportModalStyles.handle} />

            <KeyboardAwareScrollView
              ref={scrollRef}
              style={[reportModalStyles.scroll, { maxHeight: scrollMaxHeight }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              bottomOffset={0}
              extraKeyboardSpace={Platform.OS === "ios" ? 36 : 96}
              contentContainerStyle={reportModalStyles.scrollContent}
            >
              <Text
                style={[
                  reportModalStyles.title,
                  {
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: Fonts.CairoBold,
                  },
                ]}
              >
                {t("report_project", { defaultValue: "Report Project" })}
              </Text>

              <Text
                style={[
                  reportModalStyles.subtitle,
                  {
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: Fonts.CairoRegular,
                  },
                ]}
              >
                {t("report_project_hint", {
                  defaultValue:
                    "Report this project for policy violations or concerns.",
                })}
              </Text>

              <Text
                style={[
                  reportModalStyles.label,
                  {
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: Fonts.CairoSemiBold,
                  },
                ]}
              >
                {t("reason", { defaultValue: "Reason" })}
              </Text>

              <View style={reportModalStyles.reasonList}>
                {PROJECT_REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      reportModalStyles.reasonBtn,
                      reportReason === reason.value &&
                        reportModalStyles.reasonBtnActive,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      onReasonChange(reason.value as ProjectReportReason);
                    }}
                  >
                    <View
                      style={[
                        reportModalStyles.radioCircle,
                        reportReason === reason.value &&
                          reportModalStyles.radioCircleActive,
                      ]}
                    >
                      {reportReason === reason.value ? (
                        <View style={reportModalStyles.radioInner} />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        reportModalStyles.reasonText,
                        reportReason === reason.value &&
                          reportModalStyles.reasonTextActive,
                        {
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: Fonts.CairoRegular,
                        },
                      ]}
                    >
                      {t(`report_reason_${reason.value}` as const, {
                        defaultValue: isRTL ? reason.labelAr : reason.labelEn,
                      })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  reportModalStyles.label,
                  {
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: Fonts.CairoSemiBold,
                  },
                ]}
              >
                {t("description_optional", {
                  defaultValue: "Description (optional)",
                })}
              </Text>

              <TextInput
                style={[
                  reportModalStyles.input,
                  {
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: Fonts.CairoRegular,
                  },
                ]}
                placeholder={t("add_details", { defaultValue: "Add details..." })}
                placeholderTextColor="#999"
                value={reportDescription}
                onChangeText={onDescriptionChange}
                multiline
                numberOfLines={3}
                maxLength={500}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 80);
                }}
                {...withoutCredentialAutofill()}
              />
            </KeyboardAwareScrollView>

            <View
              style={[
                reportModalStyles.actionsWrap,
                { paddingBottom: actionsBottomPadding },
              ]}
              onLayout={(event) => {
                setActionsHeight(event.nativeEvent.layout.height);
              }}
            >
              <View
                style={[
                  reportModalStyles.actions,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <TouchableOpacity
                  style={reportModalStyles.cancelBtn}
                  onPress={handleClose}
                  disabled={reportSubmitting}
                >
                  <Text style={reportModalStyles.cancelText}>
                    {t("cancel", { defaultValue: "Cancel" })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    reportModalStyles.submitBtn,
                    reportSubmitting && reportModalStyles.submitDisabled,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSubmit();
                  }}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={reportModalStyles.submitText}>
                      {t("submit_report", { defaultValue: "Submit Report" })}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const reportModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPressArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHost: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  actionsWrap: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#002347",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  reasonList: {
    gap: 6,
  },
  reasonBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 4,
    alignItems: "center",
    gap: 12,
  },
  reasonBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  reasonTextActive: {
    color: Colors.primary,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: "top",
    color: "#111827",
  },
  actions: {
    gap: 12,
    marginTop: 0,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    color: "#666",
    fontFamily: Fonts.CairoSemiBold,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
    fontFamily: Fonts.CairoSemiBold,
  },
});
