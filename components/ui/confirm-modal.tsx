import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText: string;
  okText: string;
  onCancel: () => void;
  onOk: () => void;
  okDanger?: boolean;
  isRTL?: boolean;
}

export const ConfirmModal = ({
  visible,
  title,
  message,
  cancelText,
  okText,
  onCancel,
  onOk,
  okDanger = false,
  isRTL = false,
}: ConfirmModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.content}>
          <Text style={[styles.title, isRTL && { textAlign: "right" }]}>
            {title}
          </Text>
          <Text style={[styles.message, isRTL && { textAlign: "right" }]}>
            {message}
          </Text>

          <View
            style={[
              styles.buttonsRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.okButton,
                okDanger && styles.okButtonDanger,
              ]}
              onPress={onOk}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.okButtonText,
                  okDanger && styles.okButtonTextDanger,
                ]}
              >
                {okText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
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
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.secondary,
  },
  okButton: {
    backgroundColor: Colors.primary,
  },
  okButtonDanger: {
    backgroundColor: Colors.red,
  },
  okButtonText: {
    fontSize: 14,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.white,
  },
  okButtonTextDanger: {
    color: Colors.white,
  },
});
