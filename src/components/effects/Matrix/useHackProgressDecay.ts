import { useEffect } from "react";

import {
  MIN_IDLE_BEFORE_DECAY,
  PROGRESS_DECAY_BASE,
  PROGRESS_DECAY_INTERVAL,
  PROGRESS_DECAY_RAMP,
} from "./matrixSessionCopy";

interface UseHackProgressDecayOptions {
  easterEggTriggeredRef: React.RefObject<boolean>;
  idleFailureTrackerRef: React.RefObject<{ lowStreak: number }>;
  isHackingComplete: boolean;
  isVisible: boolean;
  lastKeyTimeRef: React.RefObject<number | null>;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackProgress: React.Dispatch<React.SetStateAction<number>>;
  triggerIdleFailure: () => void;
}

export function useHackProgressDecay({
  easterEggTriggeredRef,
  idleFailureTrackerRef,
  isHackingComplete,
  isVisible,
  lastKeyTimeRef,
  setHackFeedback,
  setHackProgress,
  triggerIdleFailure,
}: UseHackProgressDecayOptions) {
  useEffect(() => {
    if (!isVisible || isHackingComplete) {
      return undefined;
    }

    const fallbackInterval = window.setInterval(() => {
      const lastTime = lastKeyTimeRef.current;
      const now = Date.now();

      const applyDecay = (decayAmount: number) => {
        if (decayAmount <= 0) {
          return;
        }

        let shouldTriggerFailure = false;

        setHackProgress((prev) => {
          if (prev <= 0) {
            if (!easterEggTriggeredRef.current) {
              shouldTriggerFailure = true;
            }
            return prev;
          }

          const next = Math.max(0, prev - decayAmount);

          if (next < prev) {
            setHackFeedback((current) => {
              if (
                current ===
                "Override complete. Authentication channel stabilized."
              ) {
                return current;
              }

              return current.includes("Signal fading")
                ? current
                : "Signal fading—keep the keys alive.";
            });
          }

          if (next <= 0) {
            lastKeyTimeRef.current = null;
            if (idleFailureTrackerRef.current) {
              idleFailureTrackerRef.current.lowStreak = 0;
            }
            shouldTriggerFailure = true;
          } else if (next < 8) {
            if (idleFailureTrackerRef.current) {
              idleFailureTrackerRef.current.lowStreak += 1;

              if (idleFailureTrackerRef.current.lowStreak >= 3) {
                shouldTriggerFailure = true;
                idleFailureTrackerRef.current.lowStreak = 0;
              }
            }
          } else if (idleFailureTrackerRef.current) {
            idleFailureTrackerRef.current.lowStreak = 0;
          }

          return next;
        });

        if (shouldTriggerFailure) {
          triggerIdleFailure();
        }
      };

      if (lastTime === null) {
        applyDecay(PROGRESS_DECAY_BASE);
        return;
      }

      const idleDuration = now - lastTime;

      if (idleDuration < MIN_IDLE_BEFORE_DECAY) {
        return;
      }

      const rampDecay = PROGRESS_DECAY_RAMP.find(
        ({ threshold }) => idleDuration >= threshold,
      )?.value;

      const decay =
        rampDecay ??
        Math.min(
          PROGRESS_DECAY_BASE + (idleDuration - MIN_IDLE_BEFORE_DECAY) / 3200,
          PROGRESS_DECAY_RAMP[0].value,
        );

      applyDecay(decay);
    }, PROGRESS_DECAY_INTERVAL);

    return () => {
      window.clearInterval(fallbackInterval);
    };
  }, [
    easterEggTriggeredRef,
    idleFailureTrackerRef,
    isHackingComplete,
    isVisible,
    lastKeyTimeRef,
    setHackFeedback,
    setHackProgress,
    triggerIdleFailure,
  ]);
}
