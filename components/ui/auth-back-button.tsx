import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

type AuthBackButtonProps = {
  isRTL: boolean;
  label: string;
  onPress: () => void;
};

export function AuthBackButton({ isRTL, label, onPress }: AuthBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          alignSelf: isRTL ? "flex-end" : "flex-start",
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      hitSlop={12}
      accessibilityRole="button"
    >
      <Ionicons
        name={isRTL ? "chevron-forward" : "chevron-back"}
        size={22}
        color={Colors.primary}
      />
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  label: {
    fontFamily: Fonts.CairoBold,
    color: Colors.primary,
  },
});
