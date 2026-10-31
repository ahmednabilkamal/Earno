import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { sanitizeOtpInput } from "@/utils/otp-digits";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";

const OTP_DIGIT_FONT =
  Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }) ?? "monospace";

/** iOS tabular digits + forced LTR so OTP glyphs don’t mirror under Arabic layout. */
const OTP_INPUT_OS_EXTRAS: TextStyle =
  Platform.select({
    ios: {
      fontVariant: ["tabular-nums"],
      writingDirection: "ltr",
    },
    default: { writingDirection: "ltr" },
  }) ?? { writingDirection: "ltr" };

export interface OtpCodeInputProps
  extends Omit<TextInputProps, "onChangeText" | "value" | "maxLength"> {
  label?: string;
  value: string;
  /** Receives sanitized ASCII digits only (max length applied). */
  onChangeDigits: (digits: string) => void;
  error?: string;
  containerStyle?: object;
  maxDigits?: number;
}

/** OTP field with LTR tabular/monospace glyphs so digits don’t distort under RTL Arabic UI. */
export function OtpCodeInput({
  label,
  value,
  onChangeDigits,
  error,
  containerStyle,
  maxDigits = 6,
  placeholder,
  keyboardType = "number-pad",
  style,
  onFocus,
  onBlur,
  ...rest
}: OtpCodeInputProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ThemedText
          style={[
            styles.label,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        {...rest}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.light}
        keyboardType={keyboardType}
        maxLength={maxDigits}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        importantForAutofill="yes"
        onChangeText={(t) => onChangeDigits(sanitizeOtpInput(t, maxDigits))}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          OTP_INPUT_OS_EXTRAS,
          focused && styles.inputFocused,
          error ? styles.inputError : {},
          style,
        ]}
      />
      {error ? (
        <ThemedText
          style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}
        >
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.placeholder,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    fontSize: 22,
    lineHeight: Platform.OS === "ios" ? 28 : 26,
    color: Colors.secondary,
    fontFamily: OTP_DIGIT_FONT,
    textAlign: "center",
    letterSpacing: 6,
    width: "100%",
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.AlmaraiRegular,
  },
});
