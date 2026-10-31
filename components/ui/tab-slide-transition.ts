import type {
  BottomTabSceneInterpolatedStyle,
  BottomTabSceneInterpolationProps,
  TransitionSpec,
} from "@react-navigation/bottom-tabs";
import { Dimensions, Easing } from "react-native";
import i18n from "@/utils/i18n";

/**
 * Full-width slide between tabs. React Navigation drives `current.progress` as:
 * - 0 = focused tab
 * - 1 = route index greater than focused (to the "right" in route order)
 * - -1 = route index less than focused (to the "left")
 *
 * That matches left-to-right tab order. For RTL we flip translateX so motion is mirrored.
 */
export function tabSlideSceneInterpolator({
  current,
}: BottomTabSceneInterpolationProps): BottomTabSceneInterpolatedStyle {
  const width = Dimensions.get("window").width;
  // Match CustomTabBar (`i18n.language === "ar"`) so slide direction mirrors tab order.
  const rtl = i18n.language === "ar";
  const sign = rtl ? -1 : 1;

  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [sign * -width, 0, sign * width],
          }),
        },
      ],
    },
  };
}

export const tabSlideTransitionSpec: TransitionSpec = {
  animation: "timing",
  config: {
    duration: 280,
    easing: Easing.inOut(Easing.cubic),
  },
};
