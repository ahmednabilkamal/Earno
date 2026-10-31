import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SECURE_KEY = "earno.pending_password_reset_v2";
const WEB_KEY = "@earno:pending_password_reset_v2";

/** Values needed for POST /api/reset-password after OTP verify. */
export type PasswordResetPending = {
  phone: string;
  phoneCode: string;
  token: string;
};

export async function setPasswordResetPending(
  data: PasswordResetPending
): Promise<void> {
  const payload = JSON.stringify(data);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(WEB_KEY, payload);
    return;
  }
  await SecureStore.setItemAsync(SECURE_KEY, payload);
}

export async function getPasswordResetPending(): Promise<PasswordResetPending | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? await AsyncStorage.getItem(WEB_KEY)
        : await SecureStore.getItemAsync(SECURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PasswordResetPending;
    if (
      typeof parsed?.phone !== "string" ||
      typeof parsed?.phoneCode !== "string" ||
      typeof parsed?.token !== "string" ||
      !parsed.phone ||
      !parsed.phoneCode ||
      !parsed.token
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPasswordResetPending(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(WEB_KEY);
    await AsyncStorage.removeItem("@earno:pending_password_reset_v1");
    return;
  }
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    /* ignore */
  }
  try {
    await SecureStore.deleteItemAsync("earno.pending_password_reset_v1");
  } catch {
    /* ignore */
  }
}
