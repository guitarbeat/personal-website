import { useCallback, useEffect, useMemo, useRef } from "react";
import { DEFAULT_CONSOLE_PROMPT, HACKER_TYPER_CORPUS } from "./hackCopy";
import { getMatrixRainIntensity } from "./matrixRainIntensity";
import { useUnlock } from "./UnlockContext";
import { useHackAttempt } from "./useHackAttempt";
import { useHackEasterEgg } from "./useHackEasterEgg";
import { useHackInteraction } from "./useHackInteraction";
import { useHackProgressDecay } from "./useHackProgressDecay";
import { useHackTelemetry } from "./useHackTelemetry";
import { useMatrixRain } from "./useMatrixRain";

interface UseMatrixSessionOptions {
  isVisible: boolean;
  onDismiss?: () => void;
  onMatrixReady?: (callback: (() => void) | null) => void;
}

export const useMatrixSession = ({
  isVisible,
  onDismiss,
  onMatrixReady,
}: UseMatrixSessionOptions) => {
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
  const { completeHack, showHackCompleteFeedback } = useUnlock();

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

  const {
    easterEggs,
    easterEggTriggeredRef,
    triggerIdleFailure,
    handleDismissEasterEgg,
  } = useHackEasterEgg({
    focusHackInput,
    isVisible,
    lastKeyTimeRef,
    resetIdleFailureTracking,
    setHackFeedback,
    setHackProgress,
    setHackingBuffer,
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

  const completionTelemetry = useHackTelemetry({
    isHackComplete,
    setHackFeedback,
    setHackingBuffer,
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

  return {
    canvasRef,
    matrixRainIntensity,
    consoleDisplay,
    hackFeedback,
    hackInputRef,
    hackProgress,
    handleHackInputChange,
    handleHackKeyDown,
    handleViewportEngage,
    isHackComplete,
    showConsoleCursor,
    completionTelemetry,
    handleContainerClick,
    easterEggs,
    handleDismissEasterEgg,
  };
};
