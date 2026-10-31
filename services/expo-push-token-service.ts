import { Platform } from "react-native";
import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";

export const expoPushTokenService = {
  register: async (
    token: string,
    deviceName?: string | null
  ): Promise<void> => {
    await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS_EXPO_REGISTER, {
      token,
      device_name: deviceName ?? undefined,
      platform: Platform.OS,
    });
  },

  remove: async (token?: string | null): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.NOTIFICATIONS_EXPO_REMOVE, {
      data: token ? { token } : {},
    });
  },
};

