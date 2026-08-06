import { useEffect } from "react";

import {
  MIN_IDLE_BEFORE_DECAY,
  PROGRESS_DECAY_BASE,
  PROGRESS_DECAY_INTERVAL,
  PROGRESS_DECAY_RAMP,
} from "./hackTuning";

interface UseHackProgressDecayOptions {
  easterEggTriggeredRef: React.RefObject<boolean>;
  idleFailureTrackerRef: React.RefObject<{ lowStreak: number }>;
  isHackComplete: boolean;
  isVisible: boolean;
  lastKeyTimeRef: React.RefObject<number | null>;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackProgress: React.Dispatch<React.SetStateAction<number>>;
  triggerIdleFailure: () => void;
}

function calculateDecayAmount(lastTime: number | null, now: number): number {
  if (lastTime === null) {
    return PROGRESS_DECAY_BASE;
  }

  const idleDuration = now - lastTime;

  if (idleDuration < MIN_IDLE_BEFORE_DECAY) {
    return 0;
  }

  const rampDecay = PROGRESS_DECAY_RAMP.find(
    ({ threshold }) => idleDuration >= threshold,
  )?.value;

  return (
    rampDecay ??
    Math.min(
      PROGRESS_DECAY_BASE + (idleDuration - MIN_IDLE_BEFORE_DECAY) / 3200,
      PROGRESS_DECAY_RAMP[0].value,
    )
  );
}

function applyDecayStep(
  decayAmount: number,
  options: Omit<UseHackProgressDecayOptions, "isHackComplete" | "isVisible">,
) {
  if (decayAmount <= 0) {
    return;
  }

  let shouldTriggerFailure = false;

  options.setHackProgress((prev) => {
    if (prev <= 0) {
      if (!options.easterEggTriggeredRef.current) {
        shouldTriggerFailure = true;
      }
      return prev;
    }

    const next = Math.max(0, prev - decayAmount);

    if (next < prev) {
      options.setHackFeedback((current) =>
        current.includes("Signal fading")
          ? current
          : "Signal fading—keep the keys alive.",
      );
    }

    if (next <= 0) {
      options.lastKeyTimeRef.current = null;
      if (options.idleFailureTrackerRef.current) {
        options.idleFailureTrackerRef.current.lowStreak = 0;
      }
      shouldTriggerFailure = true;
    } else if (next < 8) {
      if (options.idleFailureTrackerRef.current) {
        options.idleFailureTrackerRef.current.lowStreak += 1;

        if (options.idleFailureTrackerRef.current.lowStreak >= 3) {
          shouldTriggerFailure = true;
          options.idleFailureTrackerRef.current.lowStreak = 0;
        }
      }
    } else if (options.idleFailureTrackerRef.current) {
      options.idleFailureTrackerRef.current.lowStreak = 0;
    }

    return next;
  });

  if (shouldTriggerFailure) {
    options.triggerIdleFailure();
  }
}

export function useHackProgressDecay({
  easterEggTriggeredRef,
  idleFailureTrackerRef,
  isHackComplete,
  isVisible,
  lastKeyTimeRef,
  setHackFeedback,
  setHackProgress,
  triggerIdleFailure,
}: UseHackProgressDecayOptions) {
  useEffect(() => {
    if (!isVisible || isHackComplete) {
      return undefined;
    }

    const fallbackInterval = window.setInterval(() => {
      const decayAmount = calculateDecayAmount(
        lastKeyTimeRef.current,
        Date.now(),
      );

      applyDecayStep(decayAmount, {
        easterEggTriggeredRef,
        idleFailureTrackerRef,
        lastKeyTimeRef,
        setHackFeedback,
        setHackProgress,
        triggerIdleFailure,
      });
    }, PROGRESS_DECAY_INTERVAL);

    return () => {
      window.clearInterval(fallbackInterval);
    };
  }, [
    easterEggTriggeredRef,
    idleFailureTrackerRef,
    isHackComplete,
    isVisible,
    lastKeyTimeRef,
    setHackFeedback,
    setHackProgress,
    triggerIdleFailure,
  ]);
}
