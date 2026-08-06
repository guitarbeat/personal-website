import { useEffect, useRef } from "react";
import {
  buildHackCompleteConsole,
  HACK_COMPLETE_FEEDBACK,
  type HackCompleteConsoleParams,
} from "./hackCopy";

interface UseMatrixCompletionProps {
  isHackComplete: boolean;
  isVisible: boolean;
  attemptStart: number;
  signalSeed: number;
  matrixCoordinate: string;
  setHackFeedback: (feedback: string | ((prev: string) => string)) => void;
  setHackingBuffer: (buffer: string | ((prev: string) => string)) => void;
  completeHack: () => void;
  onDismiss?: () => void;
}

export const useMatrixCompletion = ({
  isHackComplete,
  isVisible,
  attemptStart,
  signalSeed,
  matrixCoordinate,
  setHackFeedback,
  setHackingBuffer,
  completeHack,
  onDismiss,
}: UseMatrixCompletionProps) => {
  const completionTelemetryRef = useRef<HackCompleteConsoleParams | null>(null);
  const completionTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isHackComplete) {
      completionTelemetryRef.current = null;
      return;
    }

    if (!completionTelemetryRef.current) {
      const now = Date.now();
      const elapsedSeconds = Math.max(
        0,
        Math.round((now - attemptStart) / 1000),
      );

      const runtimeDisplay = new Date(elapsedSeconds * 1000)
        .toISOString()
        .substring(11, 19);
      const timecodeDisplay = new Date(now).toISOString().substring(11, 19);

      const oscillation = Math.sin(elapsedSeconds / 2) * 4;
      const progressBonus = 100 / 3;
      const signalGain = Math.round(
        signalSeed / 10 + oscillation + progressBonus,
      );

      const base = Math.floor(signalSeed / 3);
      const jitter = (elapsedSeconds % 7) * 3;
      const signalChannel = (base + jitter).toString().padStart(3, "0");

      completionTelemetryRef.current = {
        matrixCoordinate,
        runtimeDisplay,
        timecodeDisplay,
        signalGain,
        signalChannel,
      };
    }

    const completeReadout = buildHackCompleteConsole({
      matrixCoordinate: completionTelemetryRef.current.matrixCoordinate,
      runtimeDisplay: completionTelemetryRef.current.runtimeDisplay,
      timecodeDisplay: completionTelemetryRef.current.timecodeDisplay,
      signalGain: completionTelemetryRef.current.signalGain,
      signalChannel: completionTelemetryRef.current.signalChannel,
    });

    setHackFeedback(HACK_COMPLETE_FEEDBACK);
    setHackingBuffer(completeReadout);
  }, [
    isHackComplete,
    matrixCoordinate,
    setHackFeedback,
    setHackingBuffer,
    attemptStart,
    signalSeed,
  ]);

  useEffect(() => {
    if (!isHackComplete || completionTriggeredRef.current) {
      return undefined;
    }

    completionTriggeredRef.current = true;
    completeHack();

    const closeTimeout = window.setTimeout(() => {
      onDismiss?.();
    }, 2000);

    return () => {
      window.clearTimeout(closeTimeout);
    };
  }, [isHackComplete, completeHack, onDismiss]);

  useEffect(() => {
    if (!isVisible) {
      completionTriggeredRef.current = false;
    }
  }, [isVisible]);

  return { completionTelemetry: completionTelemetryRef.current };
};
