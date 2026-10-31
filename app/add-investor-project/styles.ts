import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginEnd: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.secondary,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: Colors.red,
  },
  errorText: {
    color: "#c00",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 15,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.secondary,
    marginBottom: 8,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#5BA8B5",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  uploadText: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: "#5BA8B5",
    marginTop: 10,
    textAlign: "center",
  },
  uploadSubtext: {
    fontSize: 12,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text?.secondary ?? "#666",
    marginTop: 6,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreviewTitle: {
    fontSize: 14,
    fontFamily: Fonts.CairoMedium,
    color: Colors.secondary,
    marginBottom: 8,
  },
  imagePreviewScroll: {
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  imagePreviewScrollContent: {
    alignItems: "center",
    paddingRight: 6,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
