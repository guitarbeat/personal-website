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
