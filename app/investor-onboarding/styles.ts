import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
  },
  stickyButtons: {
    paddingTop: 16,
    gap: 12,
    backgroundColor: Colors.appBg,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 12,
    alignSelf: "stretch",
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginBottom: 8,
    lineHeight: 30,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 6,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.primary,
    flex: 1,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.secondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: "#fff",
  },
});

export default styles;
