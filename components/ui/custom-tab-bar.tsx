import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import ChatIcon from "@/components/icons/chat";
import FavIcon from "@/components/icons/fav";
import HomeIcon from "@/components/icons/home";
import ProjectsIcon from "@/components/icons/projects";
import SettingsIcon from "@/components/icons/settings";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const INDICATOR_WIDTH = 66;
const ACTIVE_ICON_SIZE = 24;
const INACTIVE_ICON_SIZE = 24;
const INDICATOR_TEXT_CLEARANCE = 10;

const TAB_ICON_COMPONENTS: Record<string, React.ComponentType<SvgProps>> = {
  "home/index": HomeIcon,
  "conversations/index": ChatIcon,
  "favorites/index": FavIcon,
  "saved/index": ProjectsIcon,
  "settings/index": SettingsIcon,
};

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);
  const tabBarHeight = 68 + bottomInset + INDICATOR_TEXT_CLEARANCE;
  // Keep the indicator above the safe-area region.
  const indicatorBottom = bottomInset;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Filter visible routes (same logic as before)
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route) => {
      const { options } = descriptors[route.key];
      if ((options as any).href === null) return false;
      if (route.name.endsWith("/styles")) return false;
      if (route.name === "profile/index") return false;
      return true;
    });
  }, [state.routes, descriptors]);

  // Map from visible index to state index
  const visibleIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    let vi = 0;
    state.routes.forEach((route, stateIdx) => {
      const { options } = descriptors[route.key];
      if ((options as any).href === null) return;
      if (route.name.endsWith("/styles")) return;
      if (route.name === "profile/index") return;
      map[stateIdx] = vi;
      vi++;
    });
    return map;
  }, [state.routes, descriptors]);

  const activeVisibleIndex = visibleIndexMap[state.index] ?? 0;
  const tabCount = visibleRoutes.length;

  // Shared values for the sliding indicator
  const indicatorX = useSharedValue(0);
  const tabWidths = useRef<number[]>([]);
  const tabXPositions = useRef<number[]>([]);

  const updateIndicatorPosition = useCallback(
    (targetIndex: number) => {
      if (tabXPositions.current.length === tabCount && tabWidths.current.length === tabCount) {
        const x = tabXPositions.current[targetIndex] ?? 0;
        const w = tabWidths.current[targetIndex] ?? 0;
        indicatorX.value = withSpring(x + (w - INDICATOR_WIDTH) / 2, {
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        });
      } else {
        // Fallback: estimate position
        const containerPadding = 15;
        const totalPadding = containerPadding * 2 + (isRTL ? 12 : 12);
        const tabWidth = (SCREEN_WIDTH - totalPadding) / tabCount;
        const idx = isRTL ? tabCount - 1 - targetIndex : targetIndex;
        indicatorX.value = withSpring(containerPadding + idx * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2, {
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        });
      }
    },
    [tabCount, isRTL, indicatorX]
  );

  useEffect(() => {
    updateIndicatorPosition(activeVisibleIndex);
  }, [activeVisibleIndex, updateIndicatorPosition]);

  const onTabLayout = useCallback(
    (event: LayoutChangeEvent, visibleIndex: number) => {
      const { x, width } = event.nativeEvent.layout;
      tabWidths.current[visibleIndex] = width;
      tabXPositions.current[visibleIndex] = x;

      // Once all tabs have been measured, update the indicator
      if (tabWidths.current.filter(Boolean).length === tabCount) {
        updateIndicatorPosition(activeVisibleIndex);
      }
    },
    [tabCount, activeVisibleIndex, updateIndicatorPosition]
  );

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomInset,
          height: tabBarHeight,
          paddingEnd: !isRTL ? 0 : 12,
          paddingStart: !isRTL ? 12 : 0,
        },
      ]}
    >
      {/* Sliding indicator */}
      <Animated.View
        style={[
          styles.slidingIndicator,
          { bottom: indicatorBottom },
          indicatorStyle,
        ]}
      />

      <View
        style={[
          styles.content,
          {
            flexDirection: isRTL ? "row-reverse" : "row",
            paddingBottom: INDICATOR_TEXT_CLEARANCE,
          },
        ]}
      >
        {visibleRoutes.map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const stateIndex = state.routes.indexOf(route);
          const isFocused = state.index === stateIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const getIcon = () => {
            const iconColor = isFocused ? Colors.primary : Colors.barIcon;
            const iconSize = isFocused ? ACTIVE_ICON_SIZE : INACTIVE_ICON_SIZE;
            const IconComponent = TAB_ICON_COMPONENTS[route.name];
            if (!IconComponent) {
              return <View style={{ width: iconSize, height: iconSize }} />;
            }

            return (
              <View
                style={[
                  isFocused
                    ? styles.svgIconWrapperActive
                    : styles.svgIconWrapperInactive,
                ]}
              >
                <IconComponent
                  width={iconSize}
                  height={iconSize}
                  color={iconColor}
                />
              </View>
            );
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(e) => onTabLayout(e, visibleIndex)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.activeIconContainer,
                  ]}
                >
                  {getIcon()}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    !isFocused && styles.tabLabelInactive,
                  ]}
                >
                  {label as string}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E9EDF2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopLeftRadius: Platform.OS === "android" ? 16 : 20,
    borderTopRightRadius: Platform.OS === "android" ? 16 : 20,
    overflow: "hidden",
  },
  slidingIndicator: {
    position: "absolute",
    width: INDICATOR_WIDTH,
    height: 12,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    zIndex: 10,
  },
  content: {
    height: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  iconContainer: {
    width: 52,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    transform: [{ translateY: -1 }],
  },
  svgIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  svgIconWrapperActive: {
  },
  svgIconWrapperInactive: {
    opacity: 0.82,
  },
  tabLabel: {
    width: "100%",
    fontFamily: Fonts.CairoBold,
    fontSize: 12,
    color: Colors.primary,
    textAlign: "center",
  },
  tabLabelInactive: {
    fontFamily: Fonts.CairoRegular,
    color: Colors.barIcon,
  },
});