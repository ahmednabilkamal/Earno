import { Platform, TextInputProps } from "react-native";

/**
 * Use on plain TextInputs (outside CustomInput) to avoid iOS Automatic Strong Password
 * and stray credential autofill on non-login fields.
 */
export function withoutCredentialAutofill(): Pick<
  TextInputProps,
  "textContentType" | "autoComplete" | "importantForAutofill"
> {
  return {
    ...(Platform.OS === "ios" ? { textContentType: "none" as const } : {}),
    autoComplete: "off" as const,
    ...(Platform.OS === "android"
      ? { importantForAutofill: "no" as const }
      : {}),
  };
}
