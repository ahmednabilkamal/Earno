import { create } from "zustand";
import { storage } from "../utils/storage";
import { getDeviceDisplayName } from "../services/push-notification-service";

interface User {
  id: string;
  email?: string | null;
  name?: string;
  profile_photo_url?: string;
  user_type: string;
  phone?: string | null;
  status: string;
  language: string;
  avatar?: string;
  // Add other user properties as needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMaintenanceMode: boolean;

  // Actions
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  setMaintenanceMode: (enabled: boolean) => void;
}

async function syncExpoPushTokenToBackend(): Promise<void> {
  const { registerForPushNotificationsWithDetailsAsync } = await import(
    "../services/push-notification-service"
  );
  const { expoPushTokenService } = await import(
    "../services/expo-push-token-service"
  );

  const { token, error } = await registerForPushNotificationsWithDetailsAsync();
  if (!token) {
    if (error) console.warn("[push] Token sync skipped:", error);
    return;
  }

  const deviceName = getDeviceDisplayName();
  await expoPushTokenService.register(token, deviceName);
  if (__DEV__) {
    console.log("[push] Token registered with backend");
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isMaintenanceMode: false,

  setAuth: async (user, token) => {
    await storage.saveSecurely("user_token", token);
    await storage.setItem("user_data", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });

    // Backup: register via authenticated endpoint (login/register may already persist push_token).
    try {
      await syncExpoPushTokenToBackend();
    } catch (e) {
      console.warn("Failed to register Expo push token:", e);
    }
  },

  logout: async () => {
    await storage.deleteSecurely("user_token");
    await storage.removeItem("user_data");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isMaintenanceMode: false,
    });
  },

  updateUser: async (user) => {
    await storage.setItem("user_data", JSON.stringify(user));
    set({ user });
  },

  initialize: async () => {
    try {
      const token = await storage.getSecurely("user_token");
      const userData = await storage.getItem("user_data");

      if (token && userData) {
        set({
          user: JSON.parse(userData),
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        void syncExpoPushTokenToBackend().catch((e) =>
          console.warn("Failed to sync Expo push token on startup:", e)
        );
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Error initializing auth store:", error);
      set({ isLoading: false });
    }
  },

  setMaintenanceMode: (enabled) => {
    set({ isMaintenanceMode: enabled });
  },
}));
