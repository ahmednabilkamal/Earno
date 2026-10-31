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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  langToggle: {
    alignSelf: "flex-end",
    padding: 10,
    position: "absolute",
    top: -40,
    right: 0,
  },
  langText: {
    color: Colors.primary,
    fontFamily: Fonts.CairoBold,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    lineHeight: 30,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 40,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  loginButton: {
    marginTop: 20,
    height: 55,
  },
  termsSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  termsRow: {
    alignItems: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginHorizontal: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.CairoRegular,
  },
  termsLink: {
    color: Colors.primary,
    fontFamily: Fonts.CairoSemiBold,
  },
  termsError: {
    marginTop: 6,
    marginHorizontal: 10,
    fontSize: 12,
    color: Colors.error,
    fontFamily: Fonts.CairoRegular,
  },
  termsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  termsModalCard: {
    maxHeight: "88%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  termsModalHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  termsModalTitle: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Fonts.CairoBold,
  },
  termsModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  termsModalScroll: {
    width: "100%",
  },
  termsModalContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  termsModalParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text.primary,
    marginBottom: 12,
    fontFamily: Fonts.CairoRegular,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: Colors.text.secondary,
    fontSize: 16,
    fontFamily: Fonts.AlmaraiRegular,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  otpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  otpEmailText: {
    textAlign: "center",
    color: Colors.text.secondary,
    fontFamily: Fonts.CairoRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 2,
  },
  otpEmailStrong: {
    color: Colors.secondary,
    fontFamily: Fonts.CairoBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  otpInputContainer: {
    marginTop: 0,
    marginBottom: 8,
  },
  otpInputText: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 32,
    color: Colors.secondary,
    fontFamily: Fonts.CairoSemiBold,
    paddingVertical: 14,
    minHeight: 56,
  },
  otpResendLink: {
    marginTop: 8,
    alignSelf: "center",
  },
  otpResendText: {
    color: Colors.primary,
    fontFamily: Fonts.CairoBold,
    fontSize: 15,
  },
  otpEditLink: {
    marginTop: 10,
    alignSelf: "center",
  },
  otpEditText: {
    color: Colors.text.secondary,
    fontFamily: Fonts.CairoRegular,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  secondaryAuthFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 22,
    gap: 6,
  },
  secondaryAuthLinkPressable: {
    paddingVertical: 2,
  },
  otpForgotPwdPressable: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 4,
  },
  otpForgotPwdText: {
    color: Colors.primary,
    fontFamily: Fonts.CairoBold,
    fontSize: 15,
  },
});

export default styles;
