import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { isAvatarScaleTransition, prefersReducedMotion } from "@/utils/motion";
import { AvatarImage } from "./AvatarImage";
import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import {
  type AvatarPhase,
  getAvatarFrameClassName,
  persistProfileIndex,
} from "./avatarTransition.utils";
import { PROFILE_IMAGES, readStoredProfileIndex } from "./headerProfileImages";

export { AVATAR_TRANSITION_FALLBACK_MS };

function renderAvatarContent(
  phase: AvatarPhase,
  profileIndex: number,
  outgoingIndex: number | null,
  incomingIndex: number | null,
  phaseAnimating: boolean,
  onPhotoTransitionEnd: (e: React.TransitionEvent<HTMLImageElement>) => void,
) {
  if (phase === "idle") {
    return (
      <AvatarImage
        index={profileIndex}
        className="avatar__photo--active"
        fetchPriority="high"
      />
    );
  }

  if ((phase === "shrink" || phase === "slideOut") && outgoingIndex !== null) {
    return (
      <AvatarImage
        index={outgoingIndex}
        className={cn(
          "avatar__photo--outgoing",
          phase === "slideOut" &&
            phaseAnimating &&
            "avatar__photo--outgoing-exiting",
        )}
        onTransitionEnd={
          phase === "slideOut" ? onPhotoTransitionEnd : undefined
        }
      />
    );
  }

  if ((phase === "slideIn" || phase === "expand") && incomingIndex !== null) {
    const photoClassName =
      phase === "expand"
        ? "avatar__photo--active"
        : cn(
            "avatar__photo--incoming",
            phaseAnimating && "avatar__photo--incoming-active",
          );

    return (
      <AvatarImage
        index={incomingIndex}
        className={photoClassName}
        onTransitionEnd={phase === "slideIn" ? onPhotoTransitionEnd : undefined}
      />
    );
  }

  return null;
}

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
  const [phaseAnimating, setPhaseAnimating] = useState(false);

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
  }, []);

  useEffect(() => {
    if (phase === "idle") {
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

  const handleClick = useCallback(() => {
    if (phaseRef.current !== "idle") {
      return;
    }

    const nextIndex = (profileIndex + 1) % PROFILE_IMAGES.length;

    if (prefersReducedMotion()) {
      setProfileIndex(nextIndex);
      persistProfileIndex(nextIndex);
      return;
    }

    const wasHovered = buttonRef.current?.matches(":hover") ?? false;

    incomingIndexRef.current = nextIndex;
    shouldExpandRef.current = wasHovered;
    setOutgoingIndex(profileIndex);
    setIncomingIndex(nextIndex);
    setPhaseAnimating(false);
    setPhase(wasHovered ? "shrink" : "slideOut");

    transitionFallbackRef.current = setTimeout(() => {
      completeTransition();
    }, AVATAR_TRANSITION_FALLBACK_MS);
  }, [completeTransition, profileIndex]);

  const handleFrameTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLSpanElement>) => {
      if (e.target !== e.currentTarget || !isAvatarScaleTransition(e)) {
        return;
      }

      const currentPhase = phaseRef.current;

      if (currentPhase === "shrink") {
        setPhaseAnimating(false);
        setPhase("slideOut");
        return;
      }

      if (currentPhase === "expand") {
        completeTransition();
      }
    },
    [completeTransition],
  );

  const handlePhotoTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLImageElement>) => {
      if (!isAvatarScaleTransition(e)) {
        return;
      }

      const currentPhase = phaseRef.current;

      if (currentPhase === "slideOut") {
        setPhaseAnimating(false);
        setPhase("slideIn");
        return;
      }

      if (currentPhase === "slideIn") {
        setPhaseAnimating(false);

        if (shouldExpandRef.current) {
          setPhase("expand");
          return;
        }

        completeTransition();
      }
    },
    [completeTransition],
  );

  const frameClassName = getAvatarFrameClassName(phase, phaseAnimating);

  const content = renderAvatarContent(
    phase,
    profileIndex,
    outgoingIndex,
    incomingIndex,
    phaseAnimating,
    handlePhotoTransitionEnd,
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
