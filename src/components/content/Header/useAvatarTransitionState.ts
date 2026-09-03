import { useCallback, useRef, useState } from "react";
import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import {
  type AvatarPhase,
  persistProfileIndex,
} from "./avatarTransition.utils";
import { readStoredProfileIndex } from "./headerProfileImages";
import { useAvatarPhaseAnimation } from "./useAvatarPhaseAnimation";

export function useAvatarTransitionState() {
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

  const advancePhase = useCallback(
    (nextPhase: AvatarPhase) => {
      setPhaseAnimating(false);
      setPhase(nextPhase);
    },
    [setPhaseAnimating],
  );

  const startTransition = useCallback(
    (
      currentProfileIndex: number,
      nextIndex: number,
      initialPhase: AvatarPhase,
      shouldExpand: boolean,
    ) => {
      incomingIndexRef.current = nextIndex;
      shouldExpandRef.current = shouldExpand;
      setOutgoingIndex(currentProfileIndex);
      setIncomingIndex(nextIndex);
      setPhaseAnimating(false);
      setPhase(initialPhase);

      transitionFallbackRef.current = setTimeout(() => {
        completeTransition();
      }, AVATAR_TRANSITION_FALLBACK_MS);
    },
    [completeTransition, setPhaseAnimating],
  );

  const updateProfileIndexDirectly = useCallback((nextIndex: number) => {
    setProfileIndex(nextIndex);
    persistProfileIndex(nextIndex);
  }, []);

  return {
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
  };
}
