import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";

interface CustomInputProps extends TextInputProps {
  label?: string;
  containerStyle?: any;
  error?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  inputBackgroundColor?: string;
  labelColor?: string;
  borderColor?: string;
}

export default function CustomInput({
  label,
  containerStyle,
  secureTextEntry,
  error,
  leftComponent,
  rightComponent,
  inputBackgroundColor,
  labelColor,
  borderColor,
  style,
  onFocus,
  onBlur,
  textContentType: textContentTypeProp,
  autoComplete: autoCompleteProp,
  importantForAutofill: importantForAutofillProp,
  keyboardType,
  multiline,
  ...props
}: CustomInputProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const wantsEmailHints = keyboardType === "email-address";
  const wantsPhoneHints = keyboardType === "phone-pad";
  const useSystemPhoneFont = wantsPhoneHints;

  const textContentType =
    textContentTypeProp ??
    (Platform.OS === "ios"
      ? secureTextEntry
        ? undefined
        : wantsEmailHints
          ? "emailAddress"
          : wantsPhoneHints
            ? "telephoneNumber"
            : "none"
      : undefined);

  const autoComplete =
    autoCompleteProp ??
    (secureTextEntry
      ? undefined
      : wantsEmailHints
        ? "email"
        : wantsPhoneHints
          ? "tel"
          : "off");

  const importantForAutofill =
    importantForAutofillProp ??
    (Platform.OS === "android" &&
    !secureTextEntry &&
    autoComplete === "off"
      ? "no"
      : undefined);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

  const renderLabel = () => {
    const labelStr = label ?? "";
    if (!labelStr) return null;
    if (labelStr.includes("*")) {
      const parts = labelStr.split("*");
      return (
        <ThemedText
          style={[
            styles.label,
            { textAlign: isRTL ? "right" : "left" },
            labelColor ? { color: labelColor } : {},
          ]}
        >
          {parts[0]}
          <ThemedText style={{ color: "#F44336" }}>*</ThemedText>
          {parts[1]}
        </ThemedText>
      );
    }
    return (
      <ThemedText
        style={[
            styles.label,
            { textAlign: isRTL ? "right" : "left" },
            labelColor ? { color: labelColor } : {},
          ]}
        >
        {labelStr}
      </ThemedText>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLabel()}
      <View
        style={[
          styles.inputWrapper,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {leftComponent && (
          <View style={styles.leftComponent}>{leftComponent}</View>
        )}
        <TextInput
          style={[
            styles.input,
            { textAlign: isRTL ? "right" : "left" },
            useSystemPhoneFont ? { fontFamily: undefined, fontSize: 16 } : {},
            style,
            secureTextEntry
              ? {
                  paddingRight: isRTL ? 15 : 45,
                  paddingLeft: isRTL ? 45 : 15,
                }
              : {},
            error ? styles.inputError : {},
            leftComponent
              ? {
                  flex: 1,
                  paddingLeft: isRTL ? 15 : 5,
                  paddingRight: isRTL ? 5 : 15,
                }
              : {},
            rightComponent
              ? {
                  paddingRight: isRTL ? 15 : 45,
                  paddingLeft: isRTL ? 45 : 15,
                }
              : {},
            inputBackgroundColor
              ? { backgroundColor: inputBackgroundColor }
              : {},
            { borderWidth: 1 },
            error
              ? { borderColor: "#FF3B30" }
              : isFocused
                ? { borderColor: Colors.primary }
                : borderColor
                  ? { borderColor }
                  : { borderColor: Colors.border },
          ]}
          placeholderTextColor={Colors.inputPlaceholder}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          textContentType={textContentType}
          autoComplete={autoComplete}
          importantForAutofill={importantForAutofill}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightComponent && (
          <View
            style={[
              styles.rightComponentContainer,
              isRTL ? { left: 10 } : { right: 10 },
            ]}
          >
            {rightComponent}
          </View>
        )}
        {secureTextEntry && (
          <Pressable
            onPress={togglePasswordVisibility}
            style={[styles.iconContainer, isRTL ? { left: 10 } : { right: 10 }]}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.text.light}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <ThemedText
          style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
}

export { CustomInput };

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
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  leftComponent: {
    marginRight: 0,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    color: Colors.placeholder,
    height: 50,
    fontFamily: Fonts.AlmaraiRegular,
    flex: 1,
    width: "100%",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.AlmaraiRegular,
  },
  iconContainer: {
    position: "absolute",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  rightComponentContainer: {
    position: "absolute",
    height: "100%",
    justifyContent: "center",
    paddingLeft: 10,
    // borderLeftWidth: 1,
    // borderColor: Colors.borderColor,
  },
});
