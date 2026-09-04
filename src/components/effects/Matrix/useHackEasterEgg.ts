import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CONSOLE_PROMPT } from "./hackCopy";
import { ATTEMPT_START_PROGRESS } from "./hackTuning";

interface UseHackEasterEggOptions {
  focusHackInput: () => void;
  isVisible: boolean;
  lastKeyTimeRef: React.RefObject<number | null>;
  resetIdleFailureTracking: () => void;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackProgress: (updater: number | ((prev: number) => number)) => void;
  setHackingBuffer: React.Dispatch<React.SetStateAction<string>>;
}

export function useHackEasterEgg({
  focusHackInput,
  isVisible,
  lastKeyTimeRef,
  resetIdleFailureTracking,
  setHackFeedback,
  setHackProgress,
  setHackingBuffer,
}: UseHackEasterEggOptions) {
  const easterEggTriggeredRef = useRef<boolean>(false);
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
  }, [lastKeyTimeRef, resetIdleFailureTracking, setHackFeedback]);

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
    ],
  );

  useEffect(() => {
    if (!isVisible) {
      setEasterEggs([]);
      easterEggTriggeredRef.current = false;
      resetIdleFailureTracking();
    }
  }, [isVisible, resetIdleFailureTracking]);

  return {
    easterEggs,
    easterEggTriggeredRef,
    triggerIdleFailure,
    handleDismissEasterEgg,
  };
}
