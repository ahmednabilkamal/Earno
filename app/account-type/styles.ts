import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
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
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.CairoBold,
    color: Colors.secondary,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 45,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.secondary,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    width: "100%",
    marginTop: 30,
    gap: 15,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: "#DBF0F3",
    borderColor: "#67A3B1",
    shadowColor: "#4FA9B8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  cardContent: {
    alignItems: "center",
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.tagBg,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: Colors.apple,
    marginBottom: 4,
  },
  selectedCardText: {
    color: Colors.apple,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: Fonts.CairoRegular,
    color: Colors.account_type_desc,
    lineHeight: 22,
  },
});
