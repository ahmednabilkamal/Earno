import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import styles from "../styles";
import { SectionProps } from "../types";

const ARABIC_INDIC_DIGITS = /[٠-٩]/g;
const EASTERN_ARABIC_INDIC_DIGITS = /[۰-۹]/g;

const toEnglishDigits = (input: string): string =>
  input
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(EASTERN_ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 1776));

const normalizeDetailValue = (value: string | number) => toEnglishDigits(String(value));

const containsDigit = (value: string) => /\d/.test(value);

type SectionCardProps = SectionProps & {
  isRTL: boolean;
};

export function SectionCard({
  title,
  titleIcon,
  details,
  items,
  content,
  variant = "default",
  isRTL,
}: SectionCardProps) {
  const cardStyle =
    variant === "property"
      ? [styles.propertySectionCard, isRTL && styles.propertySectionCardRTL].filter(Boolean)
      : [styles.sectionCard];

  return (
    <View style={cardStyle}>
      <View
        style={[
          styles.sectionTitleRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {titleIcon != null && (
          <View style={styles.sectionTitleIcon}>
            <Ionicons
              name={titleIcon}
              size={20}
              color={Colors.primary}
            />
          </View>
        )}
        <Text
          style={[
            styles.sectionTitle,
            { textAlign: isRTL ? "right" : "left", marginBottom: 0 },
          ]}
        >
          {title}
        </Text>
      </View>

      {details &&
        Array.isArray(details) &&
        details.map((item, index) =>
          item?.subheader ? (
            <View
              key={index}
              style={[
                styles.detailSubsection,
                { alignItems: isRTL ? "flex-end" : "flex-start" },
              ]}
            >
              <Text
                style={[
                  styles.detailSubsectionLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {item?.label || ""}
              </Text>
            </View>
          ) : (
            <View
              key={index}
              style={[
                styles.detailRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              {item?.icon != null && (
                <View
                  style={[
                    styles.detailIconWrap,
                    isRTL && styles.detailIconWrapRTL,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={Colors.primary}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.detailLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {item?.label || ""}
                {item?.label ? ":" : ""}
              </Text>
              {typeof item?.value === "string" || typeof item?.value === "number" ? (
                (() => {
                  const normalizedValue = normalizeDetailValue(item.value);

                  return (
                <Text
                  style={[
                    styles.detailValue,
                    { textAlign: isRTL ? "right" : "left" },
                    containsDigit(normalizedValue) ? { writingDirection: "ltr" } : null,
                  ]}
                >
                  {normalizedValue || "N/A"}
                </Text>
                  );
                })()
              ) : (
                <View
                  style={[
                    styles.detailValueContent,
                    { alignItems: isRTL ? "flex-end" : "flex-start" },
                  ]}
                >
                  {item?.value}
                </View>
              )}
            </View>
          )
        )}

      {items &&
        Array.isArray(items) &&
        items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.listItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={styles.bullet} />
            <Text
              style={[
                styles.listText,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {item || ""}
            </Text>
          </View>
        ))}

      {content && (
        <View
          style={[
            styles.detailRow,
            { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start" },
          ]}
        >
          <View
            style={[
              styles.detailIconWrap,
              isRTL && styles.detailIconWrapRTL,
            ]}
          >
            <Ionicons name="document-text" size={18} color={Colors.primary} />
          </View>
          <Text
            style={[
              styles.sectionContent,
              { textAlign: isRTL ? "right" : "left", flex: 1, marginTop: 0 },
            ]}
          >
            {content}
          </Text>
        </View>
      )}
    </View>
  );
}
