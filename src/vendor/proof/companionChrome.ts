import type { CSSProperties } from "react";
import { companionWidth } from "./companionGeometry.js";

const POSITION_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
export const DIRECT_FEEDBACK_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";

export type CompanionChromePhase =
  | "boot"
  | "fade-in"
  | "settled"
  | "dragging"
  | "pressing";

export function companionChromePhase(options: {
  ready: boolean;
  motionReady: boolean;
  dragging: boolean;
  pressing: boolean;
}): CompanionChromePhase {
  const { ready, motionReady, dragging, pressing } = options;
  if (!ready) {
    return "boot";
  }
  if (dragging) {
    return "dragging";
  }
  if (pressing) {
    return "pressing";
  }
  if (!motionReady) {
    return "fade-in";
  }
  return "settled";
}

export function wrapperTransition(options: {
  phase: CompanionChromePhase;
  reduceMotion: boolean;
  geometryAdjusting: boolean;
  motionReady: boolean;
}): string {
  const { phase, reduceMotion, geometryAdjusting, motionReady } = options;
  if (
    reduceMotion ||
    geometryAdjusting ||
    phase === "dragging" ||
    phase === "boot"
  ) {
    return "none";
  }
  // Match pre-decomposition behavior: until motion is armed, only fade opacity
  // even if press feedback styles are already active.
  if (!motionReady || phase === "fade-in") {
    return `opacity 180ms ${POSITION_EASING}`;
  }
  return `transform 220ms ${POSITION_EASING}, opacity 180ms ${POSITION_EASING}`;
}

export function companionWrapperStyle(options: {
  size: number;
  position: { x: number; y: number };
  phase: CompanionChromePhase;
  reduceMotion: boolean;
  geometryAdjusting: boolean;
  motionReady: boolean;
  draggable: boolean;
  reactToPress: boolean;
  style?: CSSProperties;
}): CSSProperties {
  const {
    size,
    position,
    phase,
    reduceMotion,
    geometryAdjusting,
    motionReady,
    draggable,
    reactToPress,
    style,
  } = options;
  return {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    display: "inline-block",
    width: companionWidth(size),
    height: size,
    opacity: phase === "boot" ? 0 : 1,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    transition: wrapperTransition({
      phase,
      reduceMotion,
      geometryAdjusting,
      motionReady,
    }),
    touchAction: "none",
    userSelect: "none",
    cursor: draggable
      ? phase === "dragging"
        ? "grabbing"
        : "grab"
      : reactToPress
        ? "pointer"
        : "default",
    willChange: "transform",
    ...style,
  };
}

export function companionShadowStyle(options: {
  phase: CompanionChromePhase;
  reduceMotion: boolean;
}): CSSProperties {
  const { phase, reduceMotion } = options;
  return {
    position: "absolute",
    right: "14%",
    bottom: "1%",
    left: "14%",
    zIndex: 0,
    height: "4%",
    borderRadius: "50%",
    background: "rgba(0, 0, 0, 0.3)",
    filter: "blur(5px)",
    opacity: phase === "dragging" ? 0.72 : phase === "pressing" ? 0.88 : 1,
    transform:
      phase === "dragging"
        ? "scaleX(0.82)"
        : phase === "pressing"
          ? "scaleX(0.92)"
          : "scaleX(1)",
    transition: reduceMotion
      ? "none"
      : `opacity 140ms ${DIRECT_FEEDBACK_EASING}, transform 140ms ${DIRECT_FEEDBACK_EASING}`,
    pointerEvents: "none",
  };
}

export function companionSpriteStyle(options: {
  phase: CompanionChromePhase;
  reduceMotion: boolean;
  spriteStyle?: CSSProperties;
}): CSSProperties {
  const { phase, reduceMotion, spriteStyle } = options;
  return {
    position: "relative",
    zIndex: 1,
    pointerEvents: "none",
    filter:
      phase === "dragging"
        ? "drop-shadow(0 18px 14px rgba(0, 0, 0, 0.24))"
        : phase === "pressing"
          ? "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.16))"
          : "drop-shadow(0 10px 12px rgba(0, 0, 0, 0.18))",
    transformOrigin: "50% 100%",
    transition: reduceMotion
      ? "none"
      : `filter 140ms ${DIRECT_FEEDBACK_EASING}, transform 140ms ${DIRECT_FEEDBACK_EASING}`,
    transform:
      phase === "dragging"
        ? "translate3d(0, -4px, 0)"
        : phase === "pressing"
          ? "translate3d(0, 2px, 0) scale(0.985)"
          : "translate3d(0, 0, 0)",
    ...spriteStyle,
  };
}
