import { ThemedView } from "@/components/themed-view";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { investorService } from "@/services/investor-service";
import { useAuthStore } from "@/store/auth-store";
import { storage } from "@/utils/storage";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "./styles";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isMaintenanceMode } = useAuthStore();
  const splashVideoPlayer = useVideoPlayer(require("@/assets/videos/splash-video.mp4"), (player) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });
    translateY.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });

    const onVideoEndSubscription = splashVideoPlayer.addListener("playToEnd", async () => {
      if (isAuthenticated) {
        if (isMaintenanceMode) {
          router.replace("/maintenance");
          return;
        }

        const user = useAuthStore.getState().user;
        if (user?.user_type === "investor") {
          try {
            const res = await investorService.getProfile();
            const completion = res?.stats?.profile_completion ?? 0;
            router.replace(completion >= 50 ? "/home" : "/investor-onboarding");
          } catch {
            router.replace("/home");
          }
          return;
        }

        router.replace("/home");
        return;
      }

      const hasSeenIntro = await storage.getItem("has_seen_intro");

      if (hasSeenIntro === "true") {
        router.replace("/login");
      } else {
        router.replace("/intro");
      }
    });

    return () => onVideoEndSubscription.remove();
  }, [isAuthenticated, isMaintenanceMode, opacity, translateY, router, splashVideoPlayer]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.videoContainer, animatedStyle]}>
        <VideoView
          player={splashVideoPlayer}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>
      <GradientOverlay />
      <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.contentAbove} />
      </SafeAreaView>
    </ThemedView>
  );
}
