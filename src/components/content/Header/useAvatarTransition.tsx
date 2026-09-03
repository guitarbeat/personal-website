import type React from "react";
import { useCallback, useRef } from "react";

import { isAvatarScaleTransition, prefersReducedMotion } from "@/utils/motion";
import { AvatarContent } from "./AvatarContent";
import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import {
  getAvatarFrameClassName,
  getClickTransitionState,
  getNextPhaseOnFrameEnd,
  getNextPhaseOnPhotoEnd,
} from "./avatarTransition.utils";
import { PROFILE_IMAGES } from "./headerProfileImages";
import { useAvatarTransitionState } from "./useAvatarTransitionState";

export { AVATAR_TRANSITION_FALLBACK_MS };

export function useAvatarTransition() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    profileIndex,
    phase,
    outgoingIndex,
    incomingIndex,
    phaseAnimating,
    phaseRef,
    shouldExpandRef,
    completeTransition,
    advancePhase,
    startTransition,
    updateProfileIndexDirectly,
  } = useAvatarTransitionState();

  const handleClick = useCallback(() => {
    if (phaseRef.current !== "idle") {
      return;
    }

    if (prefersReducedMotion()) {
      const nextIndex = (profileIndex + 1) % PROFILE_IMAGES.length;
      updateProfileIndexDirectly(nextIndex);
      return;
    }

    const wasHovered = buttonRef.current?.matches(":hover") ?? false;
    const { nextIndex, initialPhase, shouldExpand } = getClickTransitionState(
      profileIndex,
      PROFILE_IMAGES.length,
      wasHovered,
    );

    startTransition(profileIndex, nextIndex, initialPhase, shouldExpand);
  }, [phaseRef, profileIndex, updateProfileIndexDirectly, startTransition]);

  const handleFrameTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLSpanElement>) => {
      if (e.target !== e.currentTarget || !isAvatarScaleTransition(e)) {
        return;
      }

      const { nextPhase, shouldComplete } = getNextPhaseOnFrameEnd(
        phaseRef.current,
      );

      if (nextPhase) {
        advancePhase(nextPhase);
        return;
      }

      if (shouldComplete) {
        completeTransition();
      }
    },
    [advancePhase, completeTransition, phaseRef],
  );

  const handlePhotoTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLImageElement>) => {
      if (!isAvatarScaleTransition(e)) {
        return;
      }

      const { nextPhase, shouldComplete } = getNextPhaseOnPhotoEnd(
        phaseRef.current,
        shouldExpandRef.current,
      );

      if (nextPhase) {
        advancePhase(nextPhase);
        return;
      }

      if (shouldComplete) {
        completeTransition();
      }
    },
    [advancePhase, completeTransition, phaseRef, shouldExpandRef],
  );

  const frameClassName = getAvatarFrameClassName(phase, phaseAnimating);

  const content = (
    <AvatarContent
      phase={phase}
      profileIndex={profileIndex}
      outgoingIndex={outgoingIndex}
      incomingIndex={incomingIndex}
      phaseAnimating={phaseAnimating}
      onPhotoTransitionEnd={handlePhotoTransitionEnd}
    />
  );

  return {
    buttonRef,
    content,
    frameClassName,
    handleClick,
    handleFrameTransitionEnd,
    isTransitioning: phase !== "idle",
  };
}
