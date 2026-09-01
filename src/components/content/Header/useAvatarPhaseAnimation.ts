import { useEffect, useState } from "react";
import type { AvatarPhase } from "./avatarTransition.utils";

/**
 * Manages the frame animation boolean flag for double-requestAnimationFrame CSS transition triggers.
 */
export function useAvatarPhaseAnimation(phase: AvatarPhase) {
  const [phaseAnimating, setPhaseAnimating] = useState(false);

  useEffect(() => {
    if (phase === "idle") {
      setPhaseAnimating(false);
      return;
    }

    setPhaseAnimating(false);

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhaseAnimating(true);
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [phase]);

  return [phaseAnimating, setPhaseAnimating] as const;
}
