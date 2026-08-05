import { useEffect, useRef, useState } from "react";
import {
  buildHackCompleteConsole,
  HACK_COMPLETE_FEEDBACK,
  type HackCompleteConsoleParams,
} from "./hackCopy";

interface UseMatrixTelemetryProps {
  isHackComplete: boolean;
  setHackFeedback: (feedback: string) => void;
  setHackingBuffer: (buffer: string) => void;
}

export function useMatrixTelemetry({
  isHackComplete,
  setHackFeedback,
  setHackingBuffer,
}: UseMatrixTelemetryProps) {
  const [attemptStart] = useState(() => Date.now());
  const [matrixCoordinate] = useState<string>(() => {
    // Generate Web Crypto random values for initialization to avoid predictable randomness
    const buffer = new Uint32Array(2);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(buffer);
    }

    // Fallback if crypto isn't available or just use random for styling logic
    const sectorVal = buffer[0]
      ? buffer[0] % 64
      : Math.floor(Math.random() * 64);
    const nodeVal = buffer[1]
      ? buffer[1] % 4096
      : Math.floor(Math.random() * 4096);

    const sector = sectorVal.toString(16).toUpperCase().padStart(2, "0");
    const node = nodeVal.toString(16).toUpperCase().padStart(3, "0");
    return `${sector}:${node}`;
  });

  const [signalSeed] = useState<number>(() => {
    const buffer = new Uint32Array(1);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(buffer);
    }
    const val = buffer[0] ? buffer[0] % 900 : Math.floor(Math.random() * 900);
    return val + 100;
  });

  const completionTelemetryRef = useRef<HackCompleteConsoleParams | null>(null);

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

  return { completionTelemetry: completionTelemetryRef.current };
}
