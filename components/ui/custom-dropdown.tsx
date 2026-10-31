import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { withoutCredentialAutofill } from "@/utils/text-input-autofill";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";

interface Option {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label?: string;
  placeholder: string;
  options: Option[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  containerStyle?: any;
  triggerStyle?: any;
  error?: string;
  hideLabel?: boolean;
  inputBackgroundColor?: string;
  labelColor?: string;
  borderColor?: string;
  disabled?: boolean;
  /** When true, shows a search input to filter options by label */
  searchable?: boolean;
}

export const CustomDropdown = ({
  label,
  placeholder,
  options,
  onSelect,
  selectedValue,
  containerStyle,
  triggerStyle,
  error,
  hideLabel,
  inputBackgroundColor,
  labelColor,
  borderColor,
  disabled = false,
  searchable = false,
}: CustomDropdownProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) =>
      (opt.label ?? "").toLowerCase().includes(q)
    );
  }, [options, searchQuery, searchable]);

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
      {!hideLabel && renderLabel()}

      <Pressable
        onPress={() => {
          if (!disabled) {
            setSearchQuery("");
            setModalVisible(true);
          }
        }}
        disabled={disabled}
        style={[
          styles.dropdownTrigger,
          { flexDirection: isRTL ? "row-reverse" : "row" },
          error && styles.inputError,
          inputBackgroundColor ? { backgroundColor: inputBackgroundColor } : {},
          borderColor ? { borderWidth: 1, borderColor: borderColor } : {},
          disabled && styles.disabledTrigger,
          triggerStyle,
        ]}
      >
        <ThemedText
          style={[
            styles.triggerText,
            {
              textAlign: isRTL ? "right" : "left",
              color: selectedOption ? Colors.placeholder : Colors.inputPlaceholder,
            },
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color={disabled ? "#CCC" : Colors.text.light} />
      </Pressable>

      {error && (
        <ThemedText
          style={[styles.errorText, { textAlign: isRTL ? "right" : "left" }]}
        >
          {error}
        </ThemedText>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSearchQuery("");
          setModalVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setSearchQuery("");
            setModalVisible(false);
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{label}</ThemedText>
            </View>
            {searchable ? (
              <View
                style={[
                  styles.searchWrapper,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={Colors.text.light}
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={t("search_here")}
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  {...withoutCredentialAutofill()}
                />
              </View>
            ) : null}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item.value);
                    setSearchQuery("");
                    setModalVisible(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      { textAlign: isRTL ? "right" : "left" },
                      selectedValue === item.value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.placeholder,
  },
  dropdownTrigger: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "space-between",
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
  triggerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.AlmaraiRegular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "60%",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.primary,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.AlmaraiBold,
    color: Colors.text.primary,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  optionText: {
    fontSize: 16,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.primary,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontFamily: Fonts.AlmaraiBold,
  },
  disabledTrigger: {
    opacity: 0.5,
    backgroundColor: "#F5F5F5",
  },
  disabledText: {
    color: "#999",
  },
});
