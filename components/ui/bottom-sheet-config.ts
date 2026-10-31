import { WithSpringConfig } from "react-native-reanimated";

/**
 * Smoother spring config for bottom sheet slide animations.
 * Higher stiffness = snappier, higher damping = less bounce.
 */
export const BOTTOM_SHEET_SPRING: WithSpringConfig = {
  damping: 26,
  stiffness: 320,
  mass: 0.9,
};

/** Backdrop fade duration (ms) */
export const BACKDROP_DURATION = 220;
