import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

function resolveExpoProjectId(): string | undefined {
  const c = Constants as Record<string, unknown>;
  const expoConfig = c.expoConfig as
    | { extra?: { eas?: { projectId?: string } } }
    | undefined;
  const easConfig = c.easConfig as { projectId?: string } | undefined;
  const manifest = c.manifest as
    | { extra?: { eas?: { projectId?: string } } }
    | null
    | undefined;
  const manifest2 = c.manifest2 as
    | {
        extra?: {
          expoClient?: { extra?: { eas?: { projectId?: string } } };
        };
      }
    | null
    | undefined;

  return (
    expoConfig?.extra?.eas?.projectId ??
    easConfig?.projectId ??
    manifest?.extra?.eas?.projectId ??
    manifest2?.extra?.expoClient?.extra?.eas?.projectId
  );
}

/** Human-readable device label for backend `device_name`. */
export function getDeviceDisplayName(): string | null {
  return (
    Device.deviceName ??
    Device.modelName ??
    (Device.manufacturer && Device.modelName
      ? `${Device.manufacturer} ${Device.modelName}`
      : null)
  );
}

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
  }),
});

/** Android 8+ requires this channel before remote pushes can display reliably. */
export async function ensureAndroidDefaultNotificationChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Earno",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#002347",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export type PushRegistrationResult = {
  token: string | null;
  error?: string;
};

/**
 * Registers for push notifications and returns the Expo push token.
 * Android: always attempts registration (emulator with Play Services is supported).
 * iOS: skips only on simulator where APNs token is unavailable.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const result = await registerForPushNotificationsWithDetailsAsync();
  return result.token;
}

export async function registerForPushNotificationsWithDetailsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === "ios" && !Device.isDevice) {
    return {
      token: null,
      error: "iOS Simulator — use a physical device for push",
    };
  }

  try {
    await ensureAndroidDefaultNotificationChannelAsync();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        error: `Notification permission: ${finalStatus}`,
      };
    }

    const projectId = resolveExpoProjectId();
    if (!projectId) {
      return {
        token: null,
        error: "Missing EAS projectId in app.json (extra.eas.projectId)",
      };
    }

    const pushTokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = pushTokenResult.data;

    if (!token.startsWith("ExponentPushToken[")) {
      return { token: null, error: `Unexpected token format: ${token}` };
    }

    if (__DEV__) {
      console.log(`[push] ${Platform.OS} token:`, token);
    }

    return { token };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[push] registration failed:", message);
    return {
      token: null,
      error:
        Platform.OS === "android" && message.toLowerCase().includes("fcm")
          ? `${message} — upload FCM V1 key: eas credentials → Android → FCM V1`
          : message,
    };
  }
}
