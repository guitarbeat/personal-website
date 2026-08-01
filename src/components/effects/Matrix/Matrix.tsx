import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { HackTerminal } from "./HackTerminal";
import {
  buildHackCompleteConsole,
  DEFAULT_CONSOLE_PROMPT,
  HACK_COMPLETE_FEEDBACK,
  HACKER_TYPER_CORPUS,
  type HackCompleteConsoleParams,
} from "./hackCopy";
import { ATTEMPT_START_PROGRESS } from "./hackTuning";
import "./matrix.scss";
import { getMatrixRainIntensity } from "./matrixRainIntensity";
import { NuUhUhEasterEgg } from "./NuUhUhEasterEgg";
import { useUnlock } from "./UnlockContext";
import { useHackAttempt } from "./useHackAttempt";
import { useHackInteraction } from "./useHackInteraction";
import { useHackProgressDecay } from "./useHackProgressDecay";
import { useMatrixRain } from "./useMatrixRain";

interface MatrixProps {
  isVisible: boolean;
  onDismiss?: () => void;
  onMatrixReady?: (callback: (() => void) | null) => void;
}

const Matrix = ({ isVisible, onDismiss, onMatrixReady }: MatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    hackingBuffer,
    setHackingBuffer,
    hackProgress,
    setHackProgress,
    hackFeedback,
    setHackFeedback,
    isHackComplete,
  } = useHackAttempt(isVisible);
  const rainIntensityRef = useRef(getMatrixRainIntensity(hackProgress));
  const matrixRainIntensity = getMatrixRainIntensity(hackProgress);

  useEffect(() => {
    rainIntensityRef.current = matrixRainIntensity;
  }, [matrixRainIntensity]);

  useMatrixRain(canvasRef, isVisible, rainIntensityRef);
  const completionTriggeredRef = useRef(false);
  const [attemptStart] = useState(() => Date.now());
  const [matrixCoordinate] = useState<string>(() => {
    const sector = Math.floor(Math.random() * 64)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
    const node = Math.floor(Math.random() * 4096)
      .toString(16)
      .toUpperCase()
      .padStart(3, "0");
    return `${sector}:${node}`;
  });
  const [signalSeed] = useState<number>(
    () => Math.floor(Math.random() * 900) + 100,
  );
  const { completeHack, showHackCompleteFeedback } = useUnlock();
  const easterEggTriggeredRef = useRef<boolean>(false);
  const [easterEggs, setEasterEggs] = useState<number[]>([]);
  const hackCorpus = useMemo(
    () => Array.from({ length: 24 }, () => HACKER_TYPER_CORPUS).join("\n"),
    [],
  );
  const completionTelemetryRef = useRef<HackCompleteConsoleParams | null>(null);

  const {
    hackInputRef,
    lastKeyTimeRef,
    idleFailureTrackerRef,
    handleHackInputChange,
    handleHackKeyDown,
    handleViewportEngage,
    focusHackInput,
    resetIdleFailureTracking,
    resetHackStream,
  } = useHackInteraction({
    hackCorpus,
    isHackComplete,
    setHackFeedback,
    setHackProgress,
    setHackingBuffer,
  });

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

  useHackProgressDecay({
    easterEggTriggeredRef,
    idleFailureTrackerRef,
    isHackComplete,
    isVisible,
    lastKeyTimeRef,
    setHackFeedback,
    setHackProgress,
    triggerIdleFailure,
  });

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss?.();
      } else if (
        event.key === "Enter" &&
        !showHackCompleteFeedback &&
        isHackComplete
      ) {
        onDismiss?.();
      }
    },
    [onDismiss, showHackCompleteFeedback, isHackComplete],
  );

  const consoleDisplay = hackingBuffer || DEFAULT_CONSOLE_PROMPT;
  const completionTelemetry = completionTelemetryRef.current;
  const showConsoleCursor = !isHackComplete;

  const handleContainerClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target !== canvasRef.current) {
        return;
      }

      if (showHackCompleteFeedback) {
        return;
      }

      onDismiss?.();
    },
    [showHackCompleteFeedback, onDismiss],
  );

  useEffect(() => {
    if (!onMatrixReady) {
      return undefined;
    }

    onMatrixReady(focusHackInput);

    return () => {
      onMatrixReady(null);
    };
  }, [onMatrixReady, focusHackInput]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    lastKeyTimeRef.current = null;
    focusHackInput();

    const handleKeyPress = () => {
      focusHackInput();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isVisible, handleKeyDown, focusHackInput, lastKeyTimeRef]);

  useEffect(() => {
    if (hackingBuffer === DEFAULT_CONSOLE_PROMPT) {
      resetHackStream();
    }
  }, [hackingBuffer, resetHackStream]);

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

  useEffect(() => {
    if (!isVisible || showHackCompleteFeedback) {
      return;
    }

    focusHackInput();
  }, [isVisible, showHackCompleteFeedback, focusHackInput]);

  useEffect(() => {
    if (!isVisible) {
      setEasterEggs([]);
      easterEggTriggeredRef.current = false;
      resetIdleFailureTracking();
    }
  }, [isVisible, resetIdleFailureTracking]);

  if (!isVisible) {
    return null;
  }

  return (
    <dialog
      open
      className={cn("matrix-container", isVisible && "visible")}
      onClick={handleContainerClick}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
          onDismiss?.();
        }
      }}
      aria-modal="true"
      aria-labelledby="matrix-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        border: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        className="matrix-canvas"
        role="img"
        aria-label="Matrix rain animation"
        style={
          {
            "--matrix-rain-intensity": matrixRainIntensity,
          } as React.CSSProperties
        }
      />
      <HackTerminal
        consoleDisplay={consoleDisplay}
        hackFeedback={hackFeedback}
        hackInputRef={hackInputRef}
        hackProgress={hackProgress}
        handleHackInputChange={handleHackInputChange}
        handleHackKeyDown={handleHackKeyDown}
        handleViewportEngage={handleViewportEngage}
        isHackComplete={isHackComplete}
        showConsoleCursor={showConsoleCursor}
        completionTelemetry={completionTelemetry}
      />
      <button
        type="button"
        className="matrix-close-btn"
        onClick={onDismiss}
        aria-label="Exit Matrix"
      >
        EXIT
      </button>
      {easterEggs.map((eggId) => (
        <NuUhUhEasterEgg
          key={eggId}
          id={eggId}
          onClose={() => handleDismissEasterEgg(eggId)}
        />
      ))}
    </dialog>
  );
};

export default Matrix;
