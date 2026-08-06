import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { isAvatarScaleTransition, prefersReducedMotion } from "@/utils/motion";

import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import {
  FALLBACK_PROFILE_SRC,
  FALLBACK_PROFILE_WEBP_SRC,
  PROFILE_IMAGES,
  PROFILE_INDEX_STORAGE_KEY,
  readStoredProfileIndex,
} from "./headerProfileImages";

type AvatarPhase = "idle" | "shrink" | "slideOut" | "slideIn" | "expand";

export { AVATAR_TRANSITION_FALLBACK_MS };

const persistProfileIndex = (index: number) => {
  try {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, String(index));
  } catch {
    /* quota / private mode */
  }
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  target.onerror = null;
  target.src = FALLBACK_PROFILE_SRC;

  const picture = target.closest("picture");
  const source = picture?.querySelector("source");
  if (source) {
    source.setAttribute("srcset", FALLBACK_PROFILE_WEBP_SRC);
  }
};

const renderAvatarImage = (
  index: number,
  className: string,
  options: {
    fetchPriority?: "high";
    onTransitionEnd?: (e: React.TransitionEvent<HTMLImageElement>) => void;
  } = {},
) => {
  const image = PROFILE_IMAGES[index];

  return (
    <picture key={image.webpSrc}>
      <source srcSet={image.webpSrc} type="image/webp" />
      <img
        className={cn("avatar__photo", className)}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        fetchPriority={options.fetchPriority}
        onError={handleImageError}
        onTransitionEnd={options.onTransitionEnd}
      />
    </picture>
  );
};

const getFrameClassName = (
  phase: AvatarPhase,
  phaseAnimating: boolean,
): string => {
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
};

const renderContent = (
  phase: AvatarPhase,
  phaseAnimating: boolean,
  profileIndex: number,
  outgoingIndex: number | null,
  incomingIndex: number | null,
  handlePhotoTransitionEnd: (
    e: React.TransitionEvent<HTMLImageElement>,
  ) => void,
) => {
  if (phase === "idle") {
    return renderAvatarImage(profileIndex, "avatar__photo--active", {
      fetchPriority: "high",
    });
  }

  if ((phase === "shrink" || phase === "slideOut") && outgoingIndex !== null) {
    return renderAvatarImage(
      outgoingIndex,
      cn(
        "avatar__photo--outgoing",
        phase === "slideOut" &&
          phaseAnimating &&
          "avatar__photo--outgoing-exiting",
      ),
      {
        onTransitionEnd:
          phase === "slideOut" ? handlePhotoTransitionEnd : undefined,
      },
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

    return renderAvatarImage(incomingIndex, photoClassName, {
      onTransitionEnd:
        phase === "slideIn" ? handlePhotoTransitionEnd : undefined,
    });
  }

  return null;
};

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

  const frameClassName = getFrameClassName(phase, phaseAnimating);

  const content = renderContent(
    phase,
    phaseAnimating,
    profileIndex,
    outgoingIndex,
    incomingIndex,
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
