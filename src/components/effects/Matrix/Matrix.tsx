import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { useAuth } from "./AuthContext";
import { HackTerminalPanel } from "./HackTerminalPanel";
import "./matrix.scss";
import { getMatrixRainIntensity } from "./matrixRainIntensity";
import {
  buildSuccessConsoleReadout,
  DEFAULT_CONSOLE_PROMPT,
  HACKER_TYPER_CORPUS,
  SUCCESS_FEEDBACK_MESSAGE,
  type SuccessConsoleParams,
} from "./matrixSessionCopy";
import { NuUhUhEasterEgg } from "./NuUhUhEasterEgg";
import { useHackInteraction } from "./useHackInteraction";
import { useHackProgressDecay } from "./useHackProgressDecay";
import { useHackSession } from "./useHackSession";
import { useMatrixRain } from "./useMatrixRain";

interface MatrixProps {
  isVisible: boolean;
  onSuccess?: () => void;
  onMatrixReady?: (callback: (() => void) | null) => void;
}

const Matrix = ({ isVisible, onSuccess, onMatrixReady }: MatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    hackingBuffer,
    setHackingBuffer,
    hackProgress,
    setHackProgress,
    hackFeedback,
    setHackFeedback,
    isHackingComplete,
  } = useHackSession(isVisible);
  const rainIntensityRef = useRef(getMatrixRainIntensity(hackProgress));
  const matrixRainIntensity = getMatrixRainIntensity(hackProgress);

  useEffect(() => {
    rainIntensityRef.current = matrixRainIntensity;
  }, [matrixRainIntensity]);

  useMatrixRain(canvasRef, isVisible, rainIntensityRef);
  const completionTriggeredRef = useRef(false);
  const [sessionStart] = useState(() => Date.now());
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
  const { completeHack, showSuccessFeedback } = useAuth();
  const easterEggTriggeredRef = useRef<boolean>(false);
  const [easterEggs, setEasterEggs] = useState<number[]>([]);
  const hackCorpus = useMemo(
    () => Array.from({ length: 24 }, () => HACKER_TYPER_CORPUS).join("\n"),
    [],
  );
  const successTelemetryRef = useRef<SuccessConsoleParams | null>(null);

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
    isHackingComplete,
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
    setHackFeedback(
      "Signal severed. Access denied. Reinitialize the override.",
    );

    const eggId = Date.now();
    setEasterEggs((prev) => [...prev, eggId]);
  }, [lastKeyTimeRef, resetIdleFailureTracking, setHackFeedback]);

  useHackProgressDecay({
    easterEggTriggeredRef,
    idleFailureTrackerRef,
    isHackingComplete,
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
      setHackProgress(12);
      setHackingBuffer(DEFAULT_CONSOLE_PROMPT);
      setHackFeedback("Channel reset. Re-engage manual override.");
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
        onSuccess?.();
      } else if (
        event.key === "Enter" &&
        !showSuccessFeedback &&
        isHackingComplete
      ) {
        onSuccess?.();
      }
    },
    [onSuccess, showSuccessFeedback, isHackingComplete],
  );

  const consoleDisplay = hackingBuffer || DEFAULT_CONSOLE_PROMPT;
  const successTelemetry = successTelemetryRef.current;
  const showConsoleCursor = !isHackingComplete;

  const handleContainerClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target !== canvasRef.current) {
        return;
      }

      if (showSuccessFeedback) {
        return;
      }

      onSuccess?.();
    },
    [showSuccessFeedback, onSuccess],
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
    if (!isHackingComplete) {
      successTelemetryRef.current = null;
      return;
    }

    if (!successTelemetryRef.current) {
      const now = Date.now();
      const elapsedSeconds = Math.max(
        0,
        Math.round((now - sessionStart) / 1000),
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

      successTelemetryRef.current = {
        matrixCoordinate,
        runtimeDisplay,
        timecodeDisplay,
        signalGain,
        signalChannel,
      };
    }

    const successReadout = buildSuccessConsoleReadout({
      matrixCoordinate: successTelemetryRef.current.matrixCoordinate,
      runtimeDisplay: successTelemetryRef.current.runtimeDisplay,
      timecodeDisplay: successTelemetryRef.current.timecodeDisplay,
      signalGain: successTelemetryRef.current.signalGain,
      signalChannel: successTelemetryRef.current.signalChannel,
    });

    setHackFeedback(SUCCESS_FEEDBACK_MESSAGE);
    setHackingBuffer(successReadout);
  }, [
    isHackingComplete,
    matrixCoordinate,
    setHackFeedback,
    setHackingBuffer,
    sessionStart,
    signalSeed,
  ]);

  useEffect(() => {
    if (!isHackingComplete || completionTriggeredRef.current) {
      return undefined;
    }

    completionTriggeredRef.current = true;
    completeHack();

    const closeTimeout = window.setTimeout(() => {
      onSuccess?.();
    }, 2000);

    return () => {
      window.clearTimeout(closeTimeout);
    };
  }, [isHackingComplete, completeHack, onSuccess]);

  useEffect(() => {
    if (!isVisible) {
      completionTriggeredRef.current = false;
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || showSuccessFeedback) {
      return;
    }

    focusHackInput();
  }, [isVisible, showSuccessFeedback, focusHackInput]);

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
          onSuccess?.();
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
        background: "transparent",
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
      <HackTerminalPanel
        consoleDisplay={consoleDisplay}
        hackFeedback={hackFeedback}
        hackInputRef={hackInputRef}
        hackProgress={hackProgress}
        handleHackInputChange={handleHackInputChange}
        handleHackKeyDown={handleHackKeyDown}
        handleViewportEngage={handleViewportEngage}
        isHackingComplete={isHackingComplete}
        showConsoleCursor={showConsoleCursor}
        successTelemetry={successTelemetry}
      />
      <button
        type="button"
        className="matrix-close-btn"
        onClick={onSuccess}
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
