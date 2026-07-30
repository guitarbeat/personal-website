import type { TransitionEvent } from "react";

export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isAvatarScaleTransition(
  event: TransitionEvent<HTMLElement>,
): boolean {
  return (
    !event.propertyName ||
    event.propertyName === "transform" ||
    event.propertyName === "--init-scale"
  );
}
