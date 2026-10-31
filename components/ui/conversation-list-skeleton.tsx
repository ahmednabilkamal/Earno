import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SKELETON = "#E8ECF0";

function Line({
  width,
  height,
  radius = 6,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: SKELETON,
          opacity: 0.75,
        },
        style,
      ]}
    />
  );
}

function Row({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
      <View style={styles.avatar} />
      <View style={[styles.textCol, isRTL ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
        <Line width="70%" height={16} radius={4} />
        <Line width="45%" height={12} radius={4} style={{ marginTop: 8 }} />
        <Line width="90%" height={13} radius={4} style={{ marginTop: 10 }} />
      </View>
      <Line width={36} height={12} radius={4} />
    </View>
  );
}

export function ConversationListSkeleton({ isRTL }: { isRTL: boolean }) {
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.88, { duration: 700 }), withTiming(0.55, { duration: 700 })),
      -1,
      true
    );
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.wrap, anim]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Row key={i} isRTL={isRTL} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: SKELETON,
    opacity: 0.8,
  },
  textCol: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: "center",
  },
});
