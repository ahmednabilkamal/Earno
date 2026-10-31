import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BG = "#E8ECF0";

function Bar({
  widthPct,
  height,
  alignEnd,
}: {
  widthPct: number;
  height: number;
  alignEnd?: boolean;
}) {
  return (
    <View
      style={{
        width: `${widthPct}%`,
        height,
        borderRadius: 12,
        backgroundColor: BG,
        opacity: 0.85,
        alignSelf: alignEnd ? "flex-end" : "flex-start",
      }}
    />
  );
}

export function ChatThreadSkeleton() {
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.88, { duration: 750 }), withTiming(0.55, { duration: 750 })),
      -1,
      true
    );
  }, [pulse]);
  const a = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const rows = [
    { mine: false, w: 78 },
    { mine: true, w: 62 },
    { mine: false, w: 85 },
    { mine: true, w: 55 },
    { mine: false, w: 70 },
    { mine: true, w: 72 },
    { mine: false, w: 68 },
  ];

  return (
    <Animated.View style={[styles.wrap, a]}>
      {rows.map((r, i) => (
        <View
          key={i}
          style={[styles.row, r.mine ? styles.rowMine : styles.rowTheirs]}
        >
          <Bar widthPct={r.w} height={r.mine ? 44 : 52} alignEnd={r.mine} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: "flex-end",
  },
  row: {
    marginBottom: 12,
    maxWidth: "100%",
  },
  rowMine: {
    alignItems: "flex-end",
  },
  rowTheirs: {
    alignItems: "flex-start",
  },
});
