import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "../assets/locales/ar.json";
import en from "../assets/locales/en.json";
import { storage } from "./storage";
import { primeMoyasarSdkLanguage, setMoyasarSdkLanguage } from "./moyasar-locale";

const resources = {
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
};

primeMoyasarSdkLanguage("ar");

// Initial setup with default, will be updated in _layout.tsx
i18n.use(initReactI18next).init({
  resources,
  lng: "ar",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

setMoyasarSdkLanguage("ar");

i18n.on("languageChanged", () => {
  setMoyasarSdkLanguage("ar");
});

export const initLanguage = async () => {
  const savedLanguage = await storage.getItem("language");
  if (savedLanguage && savedLanguage !== i18n.language) {
    await i18n.changeLanguage(savedLanguage);
  }
  setMoyasarSdkLanguage("ar");
};

export default i18n;
