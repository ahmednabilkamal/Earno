import { Colors } from "@/constants/colors";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SKELETON_COLOR = "#E8ECF0";

function SkeletonBox({
  width,
  height,
  borderRadius = 6,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SKELETON_COLOR,
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width="100%" height={200} borderRadius={0} />
      <View style={styles.cardContent}>
        <View style={styles.tagsRow}>
          <SkeletonBox width={60} height={24} />
          <SkeletonBox width={80} height={24} />
        </View>
        <SkeletonBox width="90%" height={18} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="70%" height={14} style={{ marginBottom: 15 }} />
        <View style={styles.detailsRow}>
          <SkeletonBox width={70} height={32} />
          <SkeletonBox width={70} height={32} />
        </View>
      </View>
    </View>
  );
}

/** My Projects / Saved tab loading placeholder */
export function SavedTabSkeleton({ isRTL }: { isRTL: boolean }) {
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1,
      true
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[{ width: "100%", paddingHorizontal: 20, paddingBottom: 32 }, pulseStyle]}>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F0F0F0",
            marginBottom: 16,
          },
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          <SkeletonBox width={160} height={22} borderRadius={6} />
        </View>
      </View>
      <View style={[savedSearchStyles.row, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={{ flex: 1 }}>
          <SkeletonBox width="100%" height={50} borderRadius={25} />
        </View>
      </View>
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </Animated.View>
  );
}

const savedSearchStyles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
});

export function HomeSkeleton({ isRTL }: { isRTL: boolean }) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 700 }),
        withTiming(0.5, { duration: 700 })
      ),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.container, pulseStyle]}>
      {/* Header — matches home: avatar + greeting */}
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={[styles.userInfo, isRTL && { flexDirection: "row-reverse" }]}>
          <SkeletonBox width={50} height={50} borderRadius={25} />
          <View
            style={[
              styles.greetingBlock,
              { alignItems: isRTL ? "flex-end" : "flex-start" },
            ]}
          >
            <SkeletonBox
              width={120}
              height={16}
              style={isRTL ? { marginRight: 10 } : { marginLeft: 10 }}
            />
            <SkeletonBox
              width={180}
              height={12}
              style={[
                { marginTop: 8 },
                isRTL ? { marginRight: 10 } : { marginLeft: 10 },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Search bar — full width */}
      <View style={[styles.searchRow, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={styles.searchBarWrap}>
          <SkeletonBox width="100%" height={50} borderRadius={25} />
        </View>
      </View>

      {/* Section title */}
      <SkeletonBox
        width={160}
        height={18}
        style={{ marginTop: 28, marginBottom: 16 }}
      />

      {/* Project cards */}
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT * 0.8,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  greetingBlock: {
    flex: 1,
    justifyContent: "center",
  },
  searchRow: {
    width: "100%",
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    paddingHorizontal: 0,
  },
  searchBarWrap: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    padding: 15,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
});
