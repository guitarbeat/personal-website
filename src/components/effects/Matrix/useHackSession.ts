import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CONSOLE_PROMPT, INITIAL_FEEDBACK } from "./matrixSessionCopy";

export const useHackSession = (isVisible: boolean) => {
  const [hackingBuffer, setHackingBuffer] = useState<string>(
    DEFAULT_CONSOLE_PROMPT,
  );
  const [hackProgress, setHackProgress] = useState<number>(12);
  const [hackFeedback, setHackFeedback] = useState<string>(INITIAL_FEEDBACK);

  const resetSession = useCallback(() => {
    setHackingBuffer(DEFAULT_CONSOLE_PROMPT);
    setHackProgress(12);
    setHackFeedback(INITIAL_FEEDBACK);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    resetSession();
  }, [isVisible, resetSession]);

  const isHackingComplete = hackProgress >= 100;

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
    isHackingComplete,
  };
};
