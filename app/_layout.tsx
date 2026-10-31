import { FontAssets } from "@/constants/fonts";
import {
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "react-native-reanimated";
import { initLanguage } from "../utils/i18n";
import { ensureAndroidDefaultNotificationChannelAsync } from "../services/push-notification-service";

import { AppToast } from "@/components/AppToast";
import { realtimeSyncService } from "@/services/realtime-sync-service";
import { investorService } from "@/services/investor-service";
import { useAuthStore } from "@/store/auth-store";
import { I18nManager, LogBox, Modal, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import NetworkLogger, {
    startNetworkLogging,
} from "react-native-network-logger";

LogBox.ignoreAllLogs();

// Start network logging
startNetworkLogging();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already prevented or unavailable; safe to ignore
});

// ---------------------------------------------------------------------------
// HARD SAFETY NET: force-hide the native splash 1.8s after the JS bundle loads,
// no matter what. Runs at module level so it fires even if React fails to
// mount, fonts hang, or auth/i18n bootstrap stalls (especially on cold-start
// deep links and Universal Links).
// ---------------------------------------------------------------------------
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {
    // Already hidden; safe to ignore
  });
}, 1800);

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const [loaded] = useFonts(FontAssets);
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  const { isAuthenticated, isLoading, initialize, isMaintenanceMode } =
    useAuthStore();
  const segments = useSegments();
  const currentSegment = segments[0];
  const currentSegmentStr = currentSegment as string | undefined;
  // Treat the "p" deep-link bridge route as part of the splash flow so that
  // deep-link processing waits until the bridge has redirected the user to
  // a real screen (home). This prevents pushing project-details while still
  // on the bridge route, which would leave the bridge in the back stack
  // and cause an infinite back-button loop.
  const isSplashFlowActive =
    !currentSegmentStr ||
    currentSegmentStr === "splash" ||
    currentSegmentStr === "p";
  const router = useRouter();
  const [showLogger, setShowLogger] = useState(false);
  const pendingNotificationDataRef = useRef<Record<string, unknown> | undefined>(undefined);
  const pendingDeepLinkRef = useRef<string | null>(null);

  // Fix #1: Track last handled deep link to avoid duplicate processing
  const lastHandledDeepLinkRef = useRef<{ url: string; timestamp: number } | null>(null);
  // Fix #3: Track if deep-link navigation is in progress to prevent auth redirects overriding it
  const deepLinkNavigationActiveRef = useRef(false);

  useEffect(() => {
    const bootstrapApp = async () => {
      // Fix #2: Set RTL flags without forcing app reload (avoids white screen on cold start)
      // The reload was causing issues when app launches from deep link
      if (I18nManager.isRTL) {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        // Note: RTL change takes effect on next app launch; no reload needed here
      }

      await initLanguage();
      await ensureAndroidDefaultNotificationChannelAsync();
      setIsI18nInitialized(true);
      initialize();
    };

    bootstrapApp().catch((error) => {
      console.error("App bootstrap failed:", error);
      setIsI18nInitialized(true);
      initialize();
    });
  }, [initialize]);

  useEffect(() => {
    if (isLoading || !isI18nInitialized || !loaded) return;

    // Always allow initial index -> splash flow, and let splash finish before redirects.
    if (isSplashFlowActive) return;

    // Fix #3: Don't redirect if deep-link navigation is in progress or if we're on a deep-link target screen
    const isDeepLinkTargetScreen =
      currentSegment === "project-details" ||
      currentSegment === "chat";
    if (deepLinkNavigationActiveRef.current || isDeepLinkTargetScreen) {
      // Clear the flag after a short delay to allow navigation to settle
      if (deepLinkNavigationActiveRef.current) {
        setTimeout(() => {
          deepLinkNavigationActiveRef.current = false;
        }, 1000);
      }
      return;
    }

    const inAuthGroup =
      currentSegment === "login" ||
      currentSegment === "forgot-password" ||
      currentSegment === "reset-password" ||
      currentSegment === "register" ||
      currentSegment === "account-type" ||
      currentSegment === "intro";
    const inMaintenanceScreen = currentSegment === "maintenance";

    if (isAuthenticated && isMaintenanceMode && !inMaintenanceScreen) {
      router.replace("/maintenance");
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and trying to access app
      router.replace("/login");
    } else if (
      isAuthenticated &&
      inAuthGroup &&
      !isMaintenanceMode &&
      !inMaintenanceScreen
    ) {
      const user = useAuthStore.getState().user;
      if (user?.user_type === "investor") {
        // Only redirect to onboarding if profile is incomplete
        investorService
          .getProfile()
          .then((res) => {
            const completion = res?.stats?.profile_completion ?? 0;
            router.replace(completion >= 50 ? "/home" : "/investor-onboarding");
          })
          .catch(() => {
            router.replace("/home");
          });
      } else {
        router.replace("/home");
      }
    }
  }, [
    isAuthenticated,
    isMaintenanceMode,
    currentSegment,
    isLoading,
    isI18nInitialized,
    loaded,
    isSplashFlowActive,
    router,
  ]);

  // Track whether the native splash has been hidden to avoid duplicate calls
  const nativeSplashHiddenRef = useRef(false);
  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHiddenRef.current) return;
    nativeSplashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {
      // Already hidden or not available; safe to ignore
    });
  }, []);

  // Hide the native splash on first render of the layout, BEFORE paint.
  // This guarantees the splash hides as soon as React is alive, even on
  // cold-start deep links where async bootstrap can stall.
  useLayoutEffect(() => {
    hideNativeSplash();
  }, [hideNativeSplash]);

  const openFromNotificationData = useCallback((data: Record<string, unknown> | undefined) => {
    if (!data) return;

    if (isSplashFlowActive) {
      pendingNotificationDataRef.current = data;
      return;
    }

    const rawType = String(data.type ?? "").toLowerCase();
    if (rawType === "project_status") {
      router.push({
        pathname: "/project-details",
        params: { id: data.id != null ? String(data.id) : "0" },
      });
      return;
    }

    if (rawType === "chat_message") {
      const otherUserId = data.sender_id != null ? Number(data.sender_id) : 0;
      const projectId = data.project_id != null ? Number(data.project_id) : 0;
      if (!otherUserId || !projectId) return;

      router.push({
        pathname: "/chat",
        params: {
          otherUserId: String(otherUserId),
          otherUserName: String(data.sender_name ?? "User"),
          projectId: String(projectId),
          projectTitle: String(data.project_title ?? ""),
        },
      });
    }
  }, [isSplashFlowActive, router]);

  // Handle notification tap routing for project status and chat message pushes.
  const notificationResponseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const notificationReceivedListenerRef = useRef<Notifications.EventSubscription | null>(null);
  useEffect(() => {
    notificationReceivedListenerRef.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as { type?: string };
        const type = String(data?.type || "").toLowerCase();

        realtimeSyncService.emit("notifications_updated");
        if (type.includes("message") || type.includes("chat")) {
          realtimeSyncService.emit("chat_updated");
        }
      });

    notificationResponseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const type = String(data?.type || "").toLowerCase();

        realtimeSyncService.emit("notifications_updated");
        if (type.includes("message") || type.includes("chat")) {
          realtimeSyncService.emit("chat_updated");
        }

        openFromNotificationData(data);
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification?.request?.content?.data as
        | Record<string, unknown>
        | undefined;
      openFromNotificationData(data);
    });

    return () => {
      if (notificationReceivedListenerRef.current) {
        notificationReceivedListenerRef.current.remove();
      }
      if (notificationResponseListenerRef.current) {
        notificationResponseListenerRef.current.remove();
      }
    };
  }, [openFromNotificationData]);

  // ─── Deep Link handler ────────────────────────────────────────────────────
  const handleDeepLink = useCallback((url: string) => {
    if (!url) return;
    if (isSplashFlowActive) {
      pendingDeepLinkRef.current = url;
      return;
    }

    // Fix #1: Deduplicate - skip if same URL was handled recently (within 3 seconds)
    const now = Date.now();
    const lastHandled = lastHandledDeepLinkRef.current;
    if (lastHandled && lastHandled.url === url && now - lastHandled.timestamp < 3000) {
      return;
    }

    try {
      const parsed = Linking.parse(url);
      const { scheme, hostname, path, queryParams } = parsed;
      const schemeLower = typeof scheme === "string" ? scheme.toLowerCase() : "";

      const pathStr = typeof path === "string" ? path : "";
      const trimmedPath = pathStr.replace(/^\/+/, "");
      const hostRaw = typeof hostname === "string" ? hostname.replace(/^\/+/, "") : "";
      const hostLower = hostRaw.toLowerCase();

      const normalizedPath =
        trimmedPath.length > 0 ? trimmedPath : hostLower.length > 0 ? hostLower : null;

      const firstQuery = (v: string | string[] | undefined): string | null => {
        if (v == null) return null;
        if (Array.isArray(v)) return v[0] ?? null;
        return v;
      };

      // Build a single "full path" string that combines host + path so we can
      // match regardless of how expo-linking parsed the URL.
      //   earno://project-details?id=42        → host=project-details, path=""
      //   earno:///project-details?id=42       → host="",              path="project-details"
      //   earno://p/58                         → host=p,               path="58"
      //   earno:///p/58/kofy                   → host="",              path="p/58/kofy"
      //   https://earno.app/p/58/kofy          → host=earno.app,       path="p/58/kofy"
      const fullPath = hostLower
        ? `${hostLower}${trimmedPath ? "/" + trimmedPath : ""}`
        : trimmedPath;

      let projectId: string | null = null;

      // /p/{id}[/{slug}] — matches both custom-scheme (earno:///p/58/kofy)
      // and universal/app-link (https://earno.app/p/58/kofy). The bridge
      // route files at app/p/[id]/* simply redirect the user to /home; once
      // we land there (isSplashFlowActive flips false), this handler runs
      // again from the pending-deep-link queue and pushes project-details
      // on top of /home. Result: stack = [home, project-details].
      if (schemeLower === "earno") {
        const m = fullPath.match(/^p\/(\d+)(?:\/|$)/);
        if (m) projectId = m[1];
      }

      if (!projectId && (schemeLower === "https" || schemeLower === "http")) {
        const hostOk =
          hostLower === "earno.app" ||
          hostLower === "www.earno.app" ||
          hostLower.endsWith(".earno.app");
        if (hostOk || hostLower === "") {
          const m = trimmedPath.match(/^p\/(\d+)(?:\/|$)/);
          if (m) projectId = m[1];
        }
      }

      // Legacy custom-scheme format: earno://project-details?id=42
      // (No matching route file, so we navigate manually.)
      if (
        !projectId &&
        schemeLower === "earno" &&
        (normalizedPath === "project-details" || fullPath === "project-details")
      ) {
        projectId = firstQuery(queryParams?.id as string | string[] | undefined);
      }

      // Legacy compatibility: earno:///lp/58 → project-details?id=58
      if (schemeLower === "earno" && !projectId) {
        const legacyMatch = normalizedPath?.match(/^lp\/(\d+)(?:\/|$)/i);
        if (legacyMatch) {
          projectId = legacyMatch[1];
        }
      }

      if (projectId) {
        lastHandledDeepLinkRef.current = { url, timestamp: now };
        deepLinkNavigationActiveRef.current = true;

        router.push({
          pathname: "/project-details",
          params: { id: projectId },
        });
      }
    } catch {
      // Ignore malformed URLs
    }
  }, [isSplashFlowActive, router]);

  // Fix #1: Track if initial URL was already processed to avoid double handling
  const initialUrlProcessedRef = useRef(false);

  useEffect(() => {
    // Handle cold-start deep link (app was not running)
    if (!initialUrlProcessedRef.current) {
      initialUrlProcessedRef.current = true;
      Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink(url);
      });
    }

    // Handle warm-start deep link (app already running)
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  useEffect(() => {
    if (isSplashFlowActive) return;

    if (pendingNotificationDataRef.current) {
      const pendingNotificationData = pendingNotificationDataRef.current;
      pendingNotificationDataRef.current = undefined;
      openFromNotificationData(pendingNotificationData);
    }

    if (pendingDeepLinkRef.current) {
      const pendingDeepLink = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      handleDeepLink(pendingDeepLink);
    }
  }, [isSplashFlowActive, openFromNotificationData, handleDeepLink]);
  // ─────────────────────────────────────────────────────────────────────────

  // Only gate rendering on fonts. i18n is already initialized synchronously at import,
  // and the splash route handles its own auth-based navigation, so we don't need to
  // block rendering on `isI18nInitialized` or `isLoading`. This avoids being stuck on
  // a blank screen after the native splash hides on cold-start deep links.
  if (!loaded) {
    // Render a plain white placeholder that matches the native splash background.
    // This prevents any flash between native-splash-hide and the React tree mounting.
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider
        statusBarTranslucent={false}
        navigationBarTranslucent={false}
        preserveEdgeToEdge={false}
      >
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="splash/index" options={{ headerShown: false }} />
            <Stack.Screen name="intro/index" options={{ headerShown: false }} />
            <Stack.Screen name="login/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="forgot-password/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="forgot-password/otp"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="reset-password/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="register/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="investor-onboarding/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="account-type/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="maintenance/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="project-details/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="p/[id]/index"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="p/[id]/[slug]"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="project-interests/[projectId]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="notifications/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="add-project/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="add-investor-project/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="payment"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="terms-and-privacy/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="contact-support/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="faqs/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="report-problem/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="my-tickets/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ticket-detail/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="create-ticket/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="search/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="chat/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="dark" />
          <AppToast />

          {__DEV__ && (
            <>
              <Pressable
                onPress={() => setShowLogger(true)}
                style={{
                  position: "absolute",
                  bottom: 100,
                  right: 20,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 10,
                  borderRadius: 20,
                  zIndex: 9999,
                }}
              >
                <Text style={{ color: "white", fontSize: 10 }}>Logs</Text>
              </Pressable>
              <Modal
                visible={showLogger}
                animationType="slide"
                onRequestClose={() => setShowLogger(false)}
              >
                <View style={{ flex: 1, paddingTop: 50 }}>
                  <Pressable
                    onPress={() => setShowLogger(false)}
                    style={{
                      padding: 15,
                      backgroundColor: "#f0f0f0",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Close Logger</Text>
                  </Pressable>
                  <NetworkLogger />
                </View>
              </Modal>
            </>
          )}
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
