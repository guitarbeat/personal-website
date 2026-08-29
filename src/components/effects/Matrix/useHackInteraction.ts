import { useCallback, useRef } from "react";

import {
  calculateInteractionResult,
  calculateNextHackProgress,
  type KeyPattern,
  updateHackStreamBuffer,
} from "./hackLogic";

interface UseHackInteractionOptions {
  hackCorpus: string;
  isHackComplete: boolean;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackProgress: React.Dispatch<React.SetStateAction<number>>;
  setHackingBuffer: React.Dispatch<React.SetStateAction<string>>;
}

export function useHackInteraction({
  hackCorpus,
  isHackComplete,
  setHackFeedback,
  setHackProgress,
  setHackingBuffer,
}: UseHackInteractionOptions) {
  const hackInputRef = useRef<HTMLInputElement>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const idleFailureTrackerRef = useRef<{ lowStreak: number }>({ lowStreak: 0 });
  const hackStreamIndexRef = useRef<number>(0);
  const keyPatternRef = useRef<KeyPattern>({
    recentKeys: [],
    lastKey: null,
    streak: 0,
  });

  const updateHackDisplay = useCallback(
    (direction: "forward" | "backward", magnitude: number) => {
      if (!Number.isFinite(magnitude) || magnitude <= 0) {
        return;
      }

      setHackingBuffer((prev) => {
        const { newBuffer, newIndex } = updateHackStreamBuffer(
          prev,
          hackStreamIndexRef.current,
          hackCorpus,
          direction,
          magnitude,
        );
        hackStreamIndexRef.current = newIndex;
        return newBuffer;
      });
    },
    [hackCorpus, setHackingBuffer],
  );

  const processHackInteraction = useCallback(
    (isBackspace: boolean, key: string = "touch") => {
      idleFailureTrackerRef.current.lowStreak = 0;

      const now = Date.now();
      const lastTime = lastKeyTimeRef.current;
      const delta = lastTime ? now - lastTime : null;

      const result = calculateInteractionResult(
        isBackspace,
        key,
        delta,
        keyPatternRef.current,
      );

      updateHackDisplay(result.direction, result.chunkSize);

      lastKeyTimeRef.current = now;
      setHackFeedback(result.feedbackMessage);

      if (result.progressDelta !== 0) {
        setHackProgress((prev) =>
          calculateNextHackProgress(prev, result.progressDelta),
        );
      }
    },
    [setHackFeedback, setHackProgress, updateHackDisplay],
  );

  const handleHackInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        event.target.value = "";
      }
    },
    [],
  );

  const handleManualHackTrigger = useCallback(() => {
    if (isHackComplete) return;
    processHackInteraction(false, "touch");
  }, [isHackComplete, processHackInteraction]);

  const handleHackKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isHackComplete) {
        return;
      }

      idleFailureTrackerRef.current.lowStreak = 0;

      const isCharacterKey =
        event.key.length === 1 ||
        event.key === "Enter" ||
        event.key === "Backspace";
      const isBackspace = event.key === "Backspace";

      if (isBackspace) {
        event.preventDefault();
        processHackInteraction(true);
      } else if (isCharacterKey) {
        event.preventDefault();
        processHackInteraction(false, event.key);
      }
    },
    [isHackComplete, processHackInteraction],
  );

  const focusHackInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      hackInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const resetIdleFailureTracking = useCallback(() => {
    idleFailureTrackerRef.current.lowStreak = 0;
  }, []);

  const resetHackStream = useCallback(() => {
    hackStreamIndexRef.current = 0;
  }, []);

  const handleViewportEngage = useCallback(() => {
    if (isHackComplete) {
      return;
    }

    handleManualHackTrigger();
    focusHackInput();
  }, [focusHackInput, handleManualHackTrigger, isHackComplete]);

  return {
    hackInputRef,
    lastKeyTimeRef,
    idleFailureTrackerRef,
    handleHackInputChange,
    handleHackKeyDown,
    handleManualHackTrigger,
    handleViewportEngage,
    focusHackInput,
    resetIdleFailureTracking,
    resetHackStream,
  };
}
