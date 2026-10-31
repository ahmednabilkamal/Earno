import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CustomButton } from "./custom-button";

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
  onButtonPress?: () => void;
}

export const SuccessModal = ({
  visible,
  title,
  message,
  buttonText,
  onClose,
  onButtonPress,
}: SuccessModalProps) => {
  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Success Icon */}
          <Image
            source={require("@/assets/images/success_project.png")}
            style={styles.successIcon}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Action Button */}
          <CustomButton
            title={buttonText}
            onPress={handleButtonPress}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.CairoBold,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.tagBg,
    width: "100%",
  },
});
