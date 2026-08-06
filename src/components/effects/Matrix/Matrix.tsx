import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { HackTerminal } from "./HackTerminal";
import { DEFAULT_CONSOLE_PROMPT, HACKER_TYPER_CORPUS } from "./hackCopy";
import "./matrix.scss";
import { getMatrixRainIntensity } from "./matrixRainIntensity";
import { generateMatrixCoordinate, generateSignalSeed } from "./matrixUtils";
import { NuUhUhEasterEgg } from "./NuUhUhEasterEgg";
import { useUnlock } from "./UnlockContext";
import { useHackAttempt } from "./useHackAttempt";
import { useHackInteraction } from "./useHackInteraction";
import { useHackProgressDecay } from "./useHackProgressDecay";
import { useMatrixCompletion } from "./useMatrixCompletion";
import { useMatrixEasterEggs } from "./useMatrixEasterEggs";
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
  const [attemptStart] = useState(() => Date.now());
  const [matrixCoordinate] = useState<string>(generateMatrixCoordinate);
  const [signalSeed] = useState<number>(generateSignalSeed);
  const { completeHack, showHackCompleteFeedback } = useUnlock();
  const easterEggTriggeredRef = useRef<boolean>(false);
  const hackCorpus = useMemo(
    () => Array.from({ length: 24 }, () => HACKER_TYPER_CORPUS).join("\n"),
    [],
  );

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

  const { easterEggs, triggerIdleFailure, handleDismissEasterEgg } =
    useMatrixEasterEggs({
      isVisible,
      resetIdleFailureTracking,
      lastKeyTimeRef,
      setHackFeedback,
      setHackProgress,
      setHackingBuffer,
      focusHackInput,
      easterEggTriggeredRef,
    });

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

  const { completionTelemetry } = useMatrixCompletion({
    isHackComplete,
    isVisible,
    attemptStart,
    signalSeed,
    matrixCoordinate,
    setHackFeedback,
    setHackingBuffer,
    completeHack,
    onDismiss,
  });

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
    if (!isVisible || showHackCompleteFeedback) {
      return;
    }

    focusHackInput();
  }, [isVisible, showHackCompleteFeedback, focusHackInput]);

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
