import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import i18n from "../../utils/i18n";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.6;

/**
 * Shared decorative circular (radial) gradient overlay for app screens.
 * Gradient center on start side (left in LTR, right in RTL), light fading to transparent.
 * Place as first child of the screen container; give main content
 * transparent background and zIndex: 1 so it sits above.
 */
export function GradientOverlay() {
  const isRTL = i18n.language === "ar";
  const cx = isRTL ? "100%" : "0%";

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Svg width={SCREEN_WIDTH} height={OVERLAY_HEIGHT} style={styles.svg}>
        <Defs>
          <RadialGradient
            id="gradientOverlay"
            cx={cx}
            cy="40%"
            r="80%"
            fx={cx}
            fy="40%"
          >
            <Stop offset="0" stopColor="#F2E94E" stopOpacity="0.25" />
            <Stop offset="0.5" stopColor="#f8f4f0" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#F2E94E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={OVERLAY_HEIGHT}
          fill="url(#gradientOverlay)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: -100,
    left: 0,
    right: 0,
    height: OVERLAY_HEIGHT,
    zIndex: 0,
  },
  svg: {
    width: "100%",
    height: "100%",
  },
});
