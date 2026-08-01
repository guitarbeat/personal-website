import { useCallback, useRef } from "react";

import { DEFAULT_CONSOLE_PROMPT } from "./hackCopy";
import {
  KEY_VARIETY_WINDOW,
  MAX_DISPLAY_LENGTH,
  REPETITION_DECAY_RESET_MS,
} from "./hackTuning";

interface KeyPattern {
  recentKeys: string[];
  lastKey: string | null;
  streak: number;
}

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
        if (direction === "backward") {
          const nextLength = Math.max(0, prev.length - magnitude);
          const trimmed =
            nextLength <= DEFAULT_CONSOLE_PROMPT.length
              ? DEFAULT_CONSOLE_PROMPT
              : prev.slice(0, nextLength);

          const nextIndex =
            (hackStreamIndexRef.current - magnitude) % hackCorpus.length;
          hackStreamIndexRef.current =
            nextIndex < 0 ? hackCorpus.length + nextIndex : nextIndex;

          return trimmed;
        }

        let remaining = magnitude;
        let chunk = "";

        while (remaining > 0) {
          const start = hackStreamIndexRef.current;
          const available = Math.min(remaining, hackCorpus.length - start);

          if (available <= 0) {
            break;
          }

          chunk += hackCorpus.slice(start, start + available);
          hackStreamIndexRef.current = (start + available) % hackCorpus.length;
          remaining -= available;
        }

        if (chunk.length === 0) {
          return prev;
        }

        const combined = `${prev}${chunk}`;
        if (combined.length <= MAX_DISPLAY_LENGTH) {
          return combined;
        }

        return combined.slice(combined.length - MAX_DISPLAY_LENGTH);
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

      let baseIncrement = 0.6;

      if (delta !== null) {
        if (delta < 120) {
          baseIncrement = 1.8;
        } else if (delta < 220) {
          baseIncrement = 1.3;
        } else if (delta < 360) {
          baseIncrement = 0.95;
        } else {
          baseIncrement = 0.45;
        }
      }

      let feedbackMessage = "Signal detected. Keep the keystrokes flowing.";
      let progressDelta = 0;

      if (isBackspace) {
        updateHackDisplay(
          "backward",
          Math.max(4, Math.round(baseIncrement * 3.5)),
        );
        keyPatternRef.current.lastKey = null;
        keyPatternRef.current.streak = 0;
        feedbackMessage = "Trace sanitized. Countermeasure resetting.";
        progressDelta = -Math.max(0.45, baseIncrement * 0.65);
      } else {
        const normalizedKey = key === " " ? "space" : key.toLowerCase();
        const tracker = keyPatternRef.current;

        if (
          tracker.lastKey === normalizedKey &&
          (delta === null || delta <= REPETITION_DECAY_RESET_MS)
        ) {
          tracker.streak += 1;
        } else {
          tracker.streak = 1;
        }

        tracker.lastKey = normalizedKey;
        tracker.recentKeys = [
          ...tracker.recentKeys.slice(-(KEY_VARIETY_WINDOW - 1)),
          normalizedKey,
        ];

        const uniqueCount = new Set(tracker.recentKeys).size;
        let comboMultiplier = 1;

        if (uniqueCount >= 7) comboMultiplier += 0.25;
        else if (uniqueCount >= 5) comboMultiplier += 0.15;

        if (normalizedKey === "touch") {
          comboMultiplier = 1.2;
        } else {
          if (tracker.streak >= 4) comboMultiplier *= 0.25;
          if (
            uniqueCount <= 3 &&
            tracker.recentKeys.length >= KEY_VARIETY_WINDOW
          )
            comboMultiplier *= 0.4;
        }

        if (delta !== null) {
          if (delta < 140)
            feedbackMessage = "Trace evaded! Ultra-fast hack underway.";
          else if (delta < 260)
            feedbackMessage = "Firewall destabilizing—stellar rhythm.";
          else if (delta < 400)
            feedbackMessage = "Maintaining uplink. Accelerate to finish.";
          else feedbackMessage = "Connection cooling—slam the keys faster!";
        }

        const comboAdjustedIncrement = baseIncrement * comboMultiplier;
        const chunkBase = Math.max(8, Math.round(comboAdjustedIncrement * 4));
        const chunkVariance = Math.floor(Math.random() * 5);
        updateHackDisplay("forward", chunkBase + chunkVariance);

        progressDelta = comboAdjustedIncrement;
      }

      lastKeyTimeRef.current = now;
      setHackFeedback(feedbackMessage);

      if (progressDelta > 0) {
        setHackProgress((prev) => {
          const friction =
            prev >= 85 ? 0.35 : prev >= 65 ? 0.5 : prev >= 40 ? 0.65 : 0.8;
          const next = prev + progressDelta * friction;
          return Math.min(100, next);
        });
      } else if (progressDelta < 0) {
        setHackProgress((prev) => Math.max(0, prev + progressDelta));
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
