import { Image } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, type ImageStyle, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VideoThumbnailProps {
  uri: string;
  style?: ViewStyle | ImageStyle;
  playIconSize?: number;
}

export function VideoThumbnail({ uri, style, playIconSize = 48 }: VideoThumbnailProps) {
  const [thumbUri, setThumbUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(uri, { time: 0 })
      .then(({ uri: thumb }) => {
        if (!cancelled) setThumbUri(thumb);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const containerStyle = style ? [styles.thumb, style] : styles.thumb;

  if (thumbUri) {
    return (
      <Image
        source={{ uri: thumbUri }}
        style={containerStyle as ImageStyle}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <View style={styles.playOverlay}>
        <Ionicons name="play-circle" size={playIconSize} color="rgba(255,255,255,0.9)" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    position: "absolute",
  },
});
