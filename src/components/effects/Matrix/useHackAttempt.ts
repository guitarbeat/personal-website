import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CONSOLE_PROMPT, INITIAL_FEEDBACK } from "./hackCopy";
import { ATTEMPT_START_PROGRESS } from "./hackTuning";

export const useHackAttempt = (isVisible: boolean) => {
  const [hackingBuffer, setHackingBuffer] = useState<string>(
    DEFAULT_CONSOLE_PROMPT,
  );
  const [hackProgress, setHackProgress] = useState<number>(
    ATTEMPT_START_PROGRESS,
  );
  const [hackFeedback, setHackFeedback] = useState<string>(INITIAL_FEEDBACK);

  const resetAttempt = useCallback(() => {
    setHackingBuffer(DEFAULT_CONSOLE_PROMPT);
    setHackProgress(ATTEMPT_START_PROGRESS);
    setHackFeedback(INITIAL_FEEDBACK);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    resetAttempt();
  }, [isVisible, resetAttempt]);

  const isHackComplete = hackProgress >= 100;

  const updateHackProgress = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setHackProgress((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : Number(updater ?? prev);

        if (Number.isNaN(next)) {
          return prev;
        }

        return Math.max(0, Math.min(100, next));
      });
    },
    [],
  );

  return {
    hackingBuffer,
    setHackingBuffer,
    hackProgress,
    setHackProgress: updateHackProgress,
    hackFeedback,
    setHackFeedback,
    isHackComplete,
  };
};
