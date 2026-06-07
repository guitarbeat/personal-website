import { useCallback, useRef } from "react";

const KEY_VARIETY_WINDOW = 12;
const REPETITION_DECAY_RESET_MS = 650;
const MAX_DISPLAY_LENGTH = 1400;
const DEFAULT_CONSOLE_PROMPT = [
  "boot> establishing uplink...",
  "boot> calibrating quantum handshake...",
  "",
].join("\n");

interface KeyPattern {
  recentKeys: string[];
  lastKey: string | null;
  streak: number;
}

interface UseHackEngineProps {
  hackCorpus: string;
  hackStreamIndexRef: React.MutableRefObject<number>;
  setHackingBuffer: React.Dispatch<React.SetStateAction<string>>;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackProgress: React.Dispatch<React.SetStateAction<number>>;
  idleFailureTrackerRef: React.MutableRefObject<{ lowStreak: number }>;
  lastKeyTimeRef: React.MutableRefObject<number | null>;
  isHackingComplete: boolean;
}

export const useHackEngine = ({
  hackCorpus,
  hackStreamIndexRef,
  setHackingBuffer,
  setHackFeedback,
  setHackProgress,
  idleFailureTrackerRef,
  lastKeyTimeRef,
  isHackingComplete,
}: UseHackEngineProps) => {
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
    [hackCorpus, setHackingBuffer, hackStreamIndexRef],
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
        // Determine key characteristics
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

        // * Enhanced combo logic for touch/random
        if (uniqueCount >= 7) comboMultiplier += 0.25;
        else if (uniqueCount >= 5) comboMultiplier += 0.15;

        // * Reduce penalties for touch interaction which might be repetitive
        if (normalizedKey === "touch") {
          comboMultiplier = 1.2; // Constant boost for touch to compensate for speed
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
            feedbackMessage = "Trace evaded! Ultra-fast breach underway.";
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
    [
      setHackFeedback,
      setHackProgress,
      updateHackDisplay,
      idleFailureTrackerRef,
      lastKeyTimeRef,
    ],
  );

  const handleManualHackTrigger = useCallback(() => {
    if (isHackingComplete) return;

    // Randomize the "key" slightly to prevent streak penalties from "touch" repetition if desired,
    // but distinct "touch" key is fine with the multiplier boost.
    // Let's mix it up slightly for visual flavor if we log it, but logic-wise "touch" is handled.
    processHackInteraction(false, "touch");

    // Also try to focus input so keyboard MIGHT open if they want, but don't force it?
    // Actually, if they tap, they probably want to tap.
    // Let's keep focus loose.
  }, [isHackingComplete, processHackInteraction]);

  const handleHackKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isHackingComplete) {
        return;
      }

      // * Reset idle failure on any interaction
      idleFailureTrackerRef.current.lowStreak = 0;

      const isCharacterKey =
        e.key.length === 1 || e.key === "Enter" || e.key === "Backspace";
      const isBackspace = e.key === "Backspace";

      if (isBackspace) {
        e.preventDefault();
        processHackInteraction(true);
      } else if (isCharacterKey) {
        e.preventDefault();
        processHackInteraction(false, e.key);
      }
    },
    [isHackingComplete, processHackInteraction, idleFailureTrackerRef],
  );

  return {
    handleManualHackTrigger,
    handleHackKeyDown,
  };
};
