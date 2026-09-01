import type React from "react";
import { useCallback, useRef, useState } from "react";

import { isAvatarScaleTransition, prefersReducedMotion } from "@/utils/motion";
import { AvatarContent } from "./AvatarContent";
import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import {
  type AvatarPhase,
  getAvatarFrameClassName,
  getClickTransitionState,
  getNextPhaseOnFrameEnd,
  getNextPhaseOnPhotoEnd,
  persistProfileIndex,
} from "./avatarTransition.utils";
import { PROFILE_IMAGES, readStoredProfileIndex } from "./headerProfileImages";
import { useAvatarPhaseAnimation } from "./useAvatarPhaseAnimation";

export { AVATAR_TRANSITION_FALLBACK_MS };

export function useAvatarTransition() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitionFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const phaseRef = useRef<AvatarPhase>("idle");
  const shouldExpandRef = useRef(false);
  const incomingIndexRef = useRef<number | null>(null);

  const [profileIndex, setProfileIndex] = useState<number>(() =>
    readStoredProfileIndex(),
  );
  const [phase, setPhase] = useState<AvatarPhase>("idle");
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [phaseAnimating, setPhaseAnimating] = useAvatarPhaseAnimation(phase);

  phaseRef.current = phase;
  incomingIndexRef.current = incomingIndex;

  const completeTransition = useCallback(() => {
    if (transitionFallbackRef.current) {
      clearTimeout(transitionFallbackRef.current);
      transitionFallbackRef.current = null;
    }

    const nextIndex = incomingIndexRef.current;
    if (nextIndex === null) {
      return;
    }

    setProfileIndex(nextIndex);
    persistProfileIndex(nextIndex);
    setPhase("idle");
    setOutgoingIndex(null);
    setIncomingIndex(null);
    shouldExpandRef.current = false;
    setPhaseAnimating(false);
  }, [setPhaseAnimating]);

  const handleClick = useCallback(() => {
    if (phaseRef.current !== "idle") {
      return;
    }

    if (prefersReducedMotion()) {
      const nextIndex = (profileIndex + 1) % PROFILE_IMAGES.length;
      setProfileIndex(nextIndex);
      persistProfileIndex(nextIndex);
      return;
    }

    const wasHovered = buttonRef.current?.matches(":hover") ?? false;
    const { nextIndex, initialPhase, shouldExpand } = getClickTransitionState(
      profileIndex,
      PROFILE_IMAGES.length,
      wasHovered,
    );

    incomingIndexRef.current = nextIndex;
    shouldExpandRef.current = shouldExpand;
    setOutgoingIndex(profileIndex);
    setIncomingIndex(nextIndex);
    setPhaseAnimating(false);
    setPhase(initialPhase);

    transitionFallbackRef.current = setTimeout(() => {
      completeTransition();
    }, AVATAR_TRANSITION_FALLBACK_MS);
  }, [completeTransition, profileIndex, setPhaseAnimating]);

  const handleFrameTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLSpanElement>) => {
      if (e.target !== e.currentTarget || !isAvatarScaleTransition(e)) {
        return;
      }

      const { nextPhase, shouldComplete } = getNextPhaseOnFrameEnd(
        phaseRef.current,
      );

      if (nextPhase) {
        setPhaseAnimating(false);
        setPhase(nextPhase);
        return;
      }

      if (shouldComplete) {
        completeTransition();
      }
    },
    [completeTransition, setPhaseAnimating],
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
        setPhaseAnimating(false);
        setPhase(nextPhase);
        return;
      }

      if (shouldComplete) {
        completeTransition();
      }
    },
    [completeTransition, setPhaseAnimating],
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
