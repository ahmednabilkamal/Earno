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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 110,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
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
    marginTop: 20,
  },
  loginButton: {
    marginTop: 30,
  },
  rememberForgotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
    flexWrap: "wrap",
  },
  rememberMePressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
    paddingVertical: 4,
    flexShrink: 1,
  },
  rememberMeLabel: {
    fontFamily: Fonts.CairoRegular,
    fontSize: 15,
    color: Colors.text.secondary,
    flexShrink: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 15,
    color: Colors.text.light,
    fontFamily: Fonts.CairoRegular,
  },
  socialContainer: {
    flexDirection: "row",
    gap: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 5,
  },
  footerText: {
    fontFamily: Fonts.CairoRegular,
    color: Colors.text.secondary,
  },
  footerLink: {
    fontFamily: Fonts.CairoBold,
    color: Colors.primary,
  },
  otpEmailStrong: {
    color: Colors.secondary,
    fontFamily: Fonts.CairoBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  otpForgotPwdPressable: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 4,
  },
  otpResendText: {
    color: Colors.primary,
    fontFamily: Fonts.CairoBold,
    fontSize: 15,
  },
});
