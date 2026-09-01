import { cn } from "@/utils/commonUtils";
import { PROFILE_INDEX_STORAGE_KEY } from "./headerProfileImages";

export type AvatarPhase = "idle" | "shrink" | "slideOut" | "slideIn" | "expand";

export function persistProfileIndex(index: number): void {
  try {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, String(index));
  } catch {
    /* quota / private mode */
  }
}

export function getAvatarFrameClassName(
  phase: AvatarPhase,
  phaseAnimating: boolean,
): string {
  if (phase === "idle") {
    return "avatar";
  }

  if (phase === "shrink") {
    return cn(
      "avatar",
      "avatar--transitioning",
      phaseAnimating ? "avatar--scale-rest" : "avatar--scale-from-hover",
    );
  }

  if (phase === "slideOut" || phase === "slideIn") {
    return cn("avatar", "avatar--transitioning", "avatar--scale-rest");
  }

  if (phase === "expand") {
    return cn(
      "avatar",
      "avatar--transitioning",
      phaseAnimating ? "avatar--scale-hover" : "avatar--scale-rest",
    );
  }

  return "avatar";
}

/**
 * Derives the next avatar transition phase or completion action when frame transition ends.
 */
export function getNextPhaseOnFrameEnd(phase: AvatarPhase): {
  nextPhase?: AvatarPhase;
  shouldComplete?: boolean;
} {
  if (phase === "shrink") {
    return { nextPhase: "slideOut" };
  }
  if (phase === "expand") {
    return { shouldComplete: true };
  }
  return {};
}

/**
 * Derives the next avatar transition phase or completion action when photo transition ends.
 */
export function getNextPhaseOnPhotoEnd(
  phase: AvatarPhase,
  shouldExpand: boolean,
): {
  nextPhase?: AvatarPhase;
  shouldComplete?: boolean;
} {
  if (phase === "slideOut") {
    return { nextPhase: "slideIn" };
  }
  if (phase === "slideIn") {
    if (shouldExpand) {
      return { nextPhase: "expand" };
    }
    return { shouldComplete: true };
  }
  return {};
}
