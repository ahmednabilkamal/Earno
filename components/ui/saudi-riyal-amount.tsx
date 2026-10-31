import React from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

const SAR_PATTERN = /\bSAR\b|ر\.?\s?س\.?/i;

type SaudiRiyalAmountProps = {
  value: string | number;
  currency?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
  iconTintColor?: string;
  locale?: string;
  numberOfLines?: number;
};

const ARABIC_INDIC_DIGITS = /[٠-٩]/g;
const EASTERN_ARABIC_INDIC_DIGITS = /[۰-۹]/g;

const toEnglishDigits = (input: string): string =>
  input
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(EASTERN_ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 1776));

const normalizeDisplayValue = (value: string | number, locale?: string): string => {
  if (typeof value === "number") {
    return value.toLocaleString(locale || "en-US");
  }

  return toEnglishDigits(
    value
    .replace(SAR_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim()
  );
};

const isSarCurrency = (value: string | number, currency?: string): boolean => {
  if (currency?.trim().toUpperCase() === "SAR") {
    return true;
  }

  return typeof value === "number" || SAR_PATTERN.test(String(value));
};

export function SaudiRiyalAmount({
  value,
  currency,
  textStyle,
  containerStyle,
  iconSize = 16,
  iconTintColor,
  locale,
  numberOfLines,
}: SaudiRiyalAmountProps) {
  const resolvedTextStyle = StyleSheet.flatten(textStyle);
  const displayValue = normalizeDisplayValue(value, locale || "en-US");

  if (!isSarCurrency(value, currency)) {
    const fallbackValue =
      typeof value === "string"
        ? value
        : currency
          ? `${displayValue} ${currency}`
          : displayValue;

    return (
      <Text style={[styles.valueText, styles.ltrText, textStyle]} numberOfLines={numberOfLines}>
        {fallbackValue}
      </Text>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require("@/assets/images/real_currency.png")}
        style={[
          styles.icon,
          { width: iconSize, height: iconSize },
          iconTintColor ? { tintColor: iconTintColor } : null,
        ]}
        resizeMode="contain"
      />
      <Text
        style={[styles.valueText, styles.ltrText, resolvedTextStyle]}
        numberOfLines={numberOfLines}
      >
        {displayValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    flexShrink: 0,
  },
  valueText: {
    flexShrink: 1,
  },
  ltrText: {
    writingDirection: "ltr",
  },
});