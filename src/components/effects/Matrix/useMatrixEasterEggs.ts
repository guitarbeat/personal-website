import type { MutableRefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CONSOLE_PROMPT } from "./hackCopy";
import { ATTEMPT_START_PROGRESS } from "./hackTuning";

interface UseMatrixEasterEggsProps {
  isVisible: boolean;
  resetIdleFailureTracking: () => void;
  lastKeyTimeRef: MutableRefObject<number | null>;
  setHackFeedback: (feedback: string | ((prev: string) => string)) => void;
  setHackProgress: (progress: number | ((prev: number) => number)) => void;
  setHackingBuffer: (buffer: string | ((prev: string) => string)) => void;
  focusHackInput: () => void;
  easterEggTriggeredRef: MutableRefObject<boolean>;
}

export const useMatrixEasterEggs = ({
  isVisible,
  resetIdleFailureTracking,
  lastKeyTimeRef,
  setHackFeedback,
  setHackProgress,
  setHackingBuffer,
  focusHackInput,
  easterEggTriggeredRef,
}: UseMatrixEasterEggsProps) => {
  const [easterEggs, setEasterEggs] = useState<number[]>([]);

  const triggerIdleFailure = useCallback(() => {
    if (easterEggTriggeredRef.current) {
      return;
    }

    easterEggTriggeredRef.current = true;
    resetIdleFailureTracking();
    lastKeyTimeRef.current = null;
    setHackFeedback("Signal severed. Access denied. Restart the hack.");

    const eggId = Date.now();
    setEasterEggs((prev) => [...prev, eggId]);
  }, [
    lastKeyTimeRef,
    resetIdleFailureTracking,
    setHackFeedback,
    easterEggTriggeredRef,
  ]);

  const handleDismissEasterEgg = useCallback(
    (eggId: number) => {
      setEasterEggs((prev) => prev.filter((id) => id !== eggId));
      resetIdleFailureTracking();
      lastKeyTimeRef.current = null;
      setHackProgress(ATTEMPT_START_PROGRESS);
      setHackingBuffer(DEFAULT_CONSOLE_PROMPT);
      setHackFeedback("Channel reset. Re-engage the hack.");
      easterEggTriggeredRef.current = false;
      focusHackInput();
    },
    [
      focusHackInput,
      lastKeyTimeRef,
      resetIdleFailureTracking,
      setHackFeedback,
      setHackProgress,
      setHackingBuffer,
      easterEggTriggeredRef,
    ],
  );

  useEffect(() => {
    if (!isVisible) {
      setEasterEggs([]);
      easterEggTriggeredRef.current = false;
      resetIdleFailureTracking();
    }
  }, [isVisible, resetIdleFailureTracking, easterEggTriggeredRef]);

  return {
    easterEggs,
    triggerIdleFailure,
    handleDismissEasterEgg,
  };
};
