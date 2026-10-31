import { Colors } from "@/constants/colors";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

const SKELETON_COLOR = "#E8ECF0";
const IMAGE_HEIGHT = 350;

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

function SectionSkeleton({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={styles.sectionCard}>
      <SkeletonBox
        width={180}
        height={18}
        style={{ marginBottom: 15 }}
      />
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.detailRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <SkeletonBox width="35%" height={14} />
          <SkeletonBox
            width="55%"
            height={14}
            style={isRTL ? { marginRight: 8 } : { marginLeft: 8 }}
          />
        </View>
      ))}
    </View>
  );
}

export function ProjectDetailsSkeleton({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={styles.container}>
      {/* Image area */}
      <SkeletonBox width="100%" height={IMAGE_HEIGHT} borderRadius={0} />

      {/* Header buttons */}
      <View
        style={[
          styles.headerButtons,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={40} height={40} borderRadius={20} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <SectionSkeleton isRTL={isRTL} />
        <SectionSkeleton isRTL={isRTL} />
        <SectionSkeleton isRTL={isRTL} />

        {/* Description block */}
        <View style={styles.sectionCard}>
          <SkeletonBox width={120} height={18} style={{ marginBottom: 12 }} />
          <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonBox width="80%" height={14} />
        </View>
      </View>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        <SkeletonBox width="100%" height={55} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  headerButtons: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    justifyContent: "space-between",
    zIndex: 10,
  },
  contentContainer: {
    marginTop: -30,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEF0F2",
  },
  detailRow: {
    marginBottom: 12,
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    zIndex: 2,
  },
});
