import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "../themed-text";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "social";
  icon?: ImageSourcePropType;
  iconName?: string;
  iconType?: "ionicons" | "fontawesome";
  style?: any;
  disabled?: boolean;
  isLoading?: boolean;
}

export const CustomButton = ({
  title,
  onPress,
  type = "primary",
  icon,
  iconName,
  iconType,
  style,
  disabled,
  isLoading,
}: CustomButtonProps) => {
  const isSocial = type === "social";

  const renderIcon = () => {
    if (isLoading) return null;
    if (icon) {
      return <Image source={icon} style={styles.icon} resizeMode="contain" />;
    }
    if (iconName) {
      if (iconType === "fontawesome") {
        return (
          <FontAwesome
            name={iconName as any}
            size={20}
            color={isSocial ? Colors.text.social : Colors.text.inverse}
            style={styles.vectorIcon}
          />
        );
      }
      return (
        <Ionicons
          name={iconName as any}
          size={20}
          color={isSocial ? Colors.text.social : Colors.text.inverse}
          style={styles.vectorIcon}
        />
      );
    }
    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.button,
        isSocial ? styles.socialButton : styles.primaryButton,
        (pressed || disabled || isLoading) && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={isSocial ? Colors.tagBg : Colors.white} />
        ) : (
          <>
            {renderIcon()}
            <ThemedText
              type="subtitle"
              style={[
                styles.text,
                isSocial ? styles.socialText : styles.primaryText,
              ]}
            >
              {title}
            </ThemedText>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: Colors.tagBg,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  socialButton: {
    backgroundColor: Colors.surface,
    flex: 1,
    marginHorizontal: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  vectorIcon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontFamily: Fonts.CairoBold,
    textAlign: "center",
  },
  primaryText: {
    color: Colors.white,
  },
  socialText: {
    color: Colors.text.social,
  },
  pressed: {
    opacity: 0.8,
  },
});
