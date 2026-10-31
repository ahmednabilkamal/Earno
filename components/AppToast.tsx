import i18n from "@/utils/i18n";
import { useEffect, useState } from "react";
import Toast, { BaseToast } from "react-native-toast-message";


const SUCCESS = "#69C779";
const ERROR = "#FE6301";
const INFO = "#87CEFA";

function rtlToastStyle(isRTL: boolean, accent: string) {
  if (!isRTL) {
    return { borderLeftColor: accent };
  }
  return {
    borderLeftWidth: 0,
    borderRightWidth: 5,
    borderRightColor: accent,
    flexDirection: "row-reverse" as const,
  };
}

export function AppToast() {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const onLang = () => setLangTick((n) => n + 1);
    i18n.on("languageChanged", onLang);
    return () => {
      i18n.off("languageChanged", onLang);
    };
  }, []);

  const isRTL = i18n.language === "ar";

  const rtlText = isRTL
    ? ({
        textAlign: "right" as const,
        writingDirection: "rtl" as const,
      } as const)
    : ({
        textAlign: "left" as const,
        writingDirection: "ltr" as const,
      } as const);

  const contentRTL = isRTL
    ? ({ alignItems: "flex-end" as const } as const)
    : undefined;

  return (
    <Toast
      config={{
        success: (props) => {
          const p = props as typeof props & {
            style?: object;
            contentContainerStyle?: object;
            text1Style?: object;
            text2Style?: object;
          };
          return (
            <BaseToast
              {...props}
              style={[rtlToastStyle(isRTL, SUCCESS), p.style]}
              contentContainerStyle={[p.contentContainerStyle, contentRTL]}
              text1Style={[p.text1Style, rtlText]}
              text2Style={[p.text2Style, rtlText]}
            />
          );
        },
        error: (props) => {
          const p = props as typeof props & {
            style?: object;
            contentContainerStyle?: object;
            text1Style?: object;
            text2Style?: object;
          };
          return (
            <BaseToast
              {...props}
              style={[rtlToastStyle(isRTL, ERROR), p.style]}
              contentContainerStyle={[p.contentContainerStyle, contentRTL]}
              text1Style={[p.text1Style, rtlText]}
              text2Style={[p.text2Style, rtlText]}
            />
          );
        },
        info: (props) => {
          const p = props as typeof props & {
            style?: object;
            contentContainerStyle?: object;
            text1Style?: object;
            text2Style?: object;
          };
          return (
            <BaseToast
              {...props}
              style={[rtlToastStyle(isRTL, INFO), p.style]}
              contentContainerStyle={[p.contentContainerStyle, contentRTL]}
              text1Style={[p.text1Style, rtlText]}
              text2Style={[p.text2Style, rtlText]}
            />
          );
        },
      }}
    />
  );
}
