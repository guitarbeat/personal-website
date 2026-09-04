import { useEffect, useRef, useState } from "react";
import { buildHackCompleteConsole, HACK_COMPLETE_FEEDBACK } from "./hackCopy";
import { secureRandom } from "./secureRandom";

interface UseHackTelemetryOptions {
  isHackComplete: boolean;
  setHackFeedback: React.Dispatch<React.SetStateAction<string>>;
  setHackingBuffer: React.Dispatch<React.SetStateAction<string>>;
}

export function useHackTelemetry({
  isHackComplete,
  setHackFeedback,
  setHackingBuffer,
}: UseHackTelemetryOptions) {
  const [attemptStart] = useState(() => Date.now());
  const [matrixCoordinate] = useState<string>(() => {
    const sector = Math.floor(secureRandom() * 64)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
    const node = Math.floor(secureRandom() * 4096)
      .toString(16)
      .toUpperCase()
      .padStart(3, "0");
    return `${sector}:${node}`;
  });
  const [signalSeed] = useState<number>(
    () => Math.floor(secureRandom() * 900) + 100,
  );

  const completionTelemetryRef = useRef<
    Parameters<typeof buildHackCompleteConsole>[0] | null
  >(null);

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

  return completionTelemetryRef.current;
}
