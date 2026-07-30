import { useEffect, useState } from "react";
import type { ReducedMotionPreference } from "./types.js";

const mediaQuery = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(
  preference: ReducedMotionPreference,
): boolean {
  const [systemPreference, setSystemPreference] = useState(false);

  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(mediaQuery);
    const update = () => setSystemPreference(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preference]);

  if (preference === "always") {
    return true;
  }
  if (preference === "never") {
    return false;
  }
  return systemPreference;
}
