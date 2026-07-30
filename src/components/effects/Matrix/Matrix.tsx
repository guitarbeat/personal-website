import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../utils/commonUtils";
import { useAuth } from "./AuthContext";
import "./matrix.scss";
import {
  buildSuccessConsoleReadout,
  DEFAULT_CONSOLE_PROMPT,
  HACKER_TYPER_CORPUS,
  KEY_VARIETY_WINDOW,
  MAX_DISPLAY_LENGTH,
  MIN_IDLE_BEFORE_DECAY,
  PROGRESS_DECAY_BASE,
  PROGRESS_DECAY_INTERVAL,
  PROGRESS_DECAY_RAMP,
  REPETITION_DECAY_RESET_MS,
  SUCCESS_FEEDBACK_MESSAGE,
  type SuccessConsoleParams,
} from "./matrixSessionCopy";
import { NuUhUhEasterEgg } from "./NuUhUhEasterEgg";
import { useHackSession } from "./useHackSession";
import { useMatrixRain } from "./useMatrixRain";

interface MatrixProps {
  isVisible: boolean;
  onSuccess?: () => void;
  onMatrixReady?: (callback: (() => void) | null) => void;
}

const Matrix = ({ isVisible, onSuccess, onMatrixReady }: MatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMatrixRain(canvasRef, isVisible);
  const {
    hackingBuffer,
    setHackingBuffer,
    hackProgress,
    setHackProgress,
    hackFeedback,
    setHackFeedback,
    isHackingComplete,
  } = useHackSession(isVisible);
  const hackInputRef = useRef<HTMLInputElement>(null);
  const completionTriggeredRef = useRef(false);
  const [sessionStart] = useState(() => Date.now());
  // * Performance optimization: Removed sessionClock state to prevent 1Hz re-renders
  // * Values are now calculated only when needed (on success)
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
  const lastKeyTimeRef = useRef<number | null>(null);
  const idleFailureTrackerRef = useRef<{ lowStreak: number }>({ lowStreak: 0 });
  const { completeHack, showSuccessFeedback } = useAuth();
  const easterEggTriggeredRef = useRef<boolean>(false);
  const [easterEggs, setEasterEggs] = useState<number[]>([]);
  const hackCorpus = useMemo(
    () => Array.from({ length: 24 }, () => HACKER_TYPER_CORPUS).join("\n"),
    [],
  );
  const hackStreamIndexRef = useRef<number>(0);
  interface KeyPattern {
    recentKeys: string[];
    lastKey: string | null;
    streak: number;
  }
  const keyPatternRef = useRef<KeyPattern>({
    recentKeys: [],
    lastKey: null,
    streak: 0,
  });
  const successTelemetryRef = useRef<SuccessConsoleParams | null>(null);

  // * Configuration constants

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
    [hackCorpus, setHackingBuffer],
  );

  const handleHackInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        event.target.value = "";
      }
    },
    [],
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
    [setHackFeedback, setHackProgress, updateHackDisplay],
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
    [isHackingComplete, processHackInteraction],
  );

  const focusHackInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      (hackInputRef.current as HTMLInputElement | null)?.focus({
        preventScroll: true,
      });
    });
  }, []);

  useEffect(() => {
    if (!onMatrixReady) {
      return undefined;
    }

    onMatrixReady(focusHackInput);

    return () => {
      onMatrixReady(null);
    };
  }, [onMatrixReady, focusHackInput]);

  const resetIdleFailureTracking = useCallback(() => {
    idleFailureTrackerRef.current.lowStreak = 0;
  }, []);

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
  }, [resetIdleFailureTracking, setHackFeedback]);

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
      resetIdleFailureTracking,
      setHackFeedback,
      setHackProgress,
      setHackingBuffer,
    ],
  );

  // * Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSuccess?.();
      } else if (
        e.key === "Enter" &&
        !showSuccessFeedback &&
        isHackingComplete
      ) {
        onSuccess?.();
      }
    },
    [onSuccess, showSuccessFeedback, isHackingComplete],
  );

  // (Removed unused telemetry helpers)

  const consoleDisplay = hackingBuffer || DEFAULT_CONSOLE_PROMPT;
  const successTelemetry = successTelemetryRef.current;
  const showConsoleCursor = !isHackingComplete;

  const handleViewportEngage = useCallback(() => {
    if (isHackingComplete) {
      return;
    }

    // Trigger manual interaction (supports "tap to trigger")
    handleManualHackTrigger();

    // Also try to focus for keyboard users, but don't blocking tap flow
    focusHackInput();
  }, [focusHackInput, isHackingComplete, handleManualHackTrigger]);

  // * Handle container clicks
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) {
        return;
      }

      if (showSuccessFeedback) {
        return;
      }

      onSuccess?.();
    },
    [showSuccessFeedback, onSuccess],
  );

  // * Keyboard event listeners
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
  }, [isVisible, handleKeyDown, focusHackInput]);

  useEffect(() => {
    if (hackingBuffer === DEFAULT_CONSOLE_PROMPT) {
      hackStreamIndexRef.current = 0;
    }
  }, [hackingBuffer]);

  useEffect(() => {
    if (!isHackingComplete) {
      successTelemetryRef.current = null;
      return;
    }

    if (!successTelemetryRef.current) {
      // * Calculate telemetry only on completion to avoid re-renders during gameplay
      const now = Date.now();
      const elapsedSeconds = Math.max(
        0,
        Math.round((now - sessionStart) / 1000),
      );

      const rDisplay = new Date(elapsedSeconds * 1000)
        .toISOString()
        .substring(11, 19);
      const tDisplay = new Date(now).toISOString().substring(11, 19);

      const oscillation = Math.sin(elapsedSeconds / 2) * 4;
      const progressBonus = 100 / 3; // hackProgress is >= 100 here
      const sGain = Math.round(signalSeed / 10 + oscillation + progressBonus);

      const base = Math.floor(signalSeed / 3);
      const jitter = (elapsedSeconds % 7) * 3;
      const sChannel = (base + jitter).toString().padStart(3, "0");

      successTelemetryRef.current = {
        matrixCoordinate,
        runtimeDisplay: rDisplay,
        timecodeDisplay: tDisplay,
        signalGain: sGain,
        signalChannel: sChannel,
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
          // * If already at 0 or below, check if we should trigger failure
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

          // * Check if progress reached 0 (using <= to handle floating point precision)
          if (next <= 0) {
            lastKeyTimeRef.current = null;
            idleFailureTrackerRef.current.lowStreak = 0;
            shouldTriggerFailure = true;
          } else if (next < 8) {
            idleFailureTrackerRef.current.lowStreak += 1;

            if (idleFailureTrackerRef.current.lowStreak >= 3) {
              shouldTriggerFailure = true;
              idleFailureTrackerRef.current.lowStreak = 0;
            }
          } else {
            idleFailureTrackerRef.current.lowStreak = 0;
          }

          return next;
        });

        // * Trigger failure after state update if needed
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
    isVisible,
    isHackingComplete,
    setHackFeedback,
    setHackProgress,
    triggerIdleFailure,
  ]);

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

  // (Removed unused easter-egg test handler)

  if (!isVisible) {
    return null;
  }

  return (
    <dialog
      open
      className={cn("matrix-container", isVisible && "visible")}
      onClick={handleContainerClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
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
      />
      <div className="hack-terminal-frame">
        <div className="hack-terminal-titlebar">
          <div className="hack-terminal-titlebar__label">
            {hackProgress < 33
              ? "PHASE 1: FIREWALL PENETRATION // BREACHING..."
              : hackProgress < 66
                ? "PHASE 2: DECRYPTING SECURE HANDSHAKE..."
                : hackProgress < 100
                  ? "PHASE 3: OVERRIDING CORE KERNEL..."
                  : "ACCESS GRANTED // SYSTEM UNLOCKED"}
          </div>
          <div style={{ fontSize: "0.65rem", opacity: 0.6 }}>
            {hackProgress < 100
              ? `SECURE CHANNEL: ${hackProgress < 33 ? "LOCKED" : hackProgress < 66 ? "DECRYPTING" : "OPEN"}`
              : "SYSTEM READY"}
          </div>
        </div>
        <div className="hack-terminal-screen">
          <div className="matrix-console-grid">
            <div
              className={cn(
                "hack-input-panel",
                isHackingComplete && "complete",
              )}
            >
              <div className="hack-sequencer">
                <div className="hack-sequencer__header">
                  <span className="hack-sequencer__spacer" aria-hidden="true">
                    {Math.round(hackProgress)}%
                  </span>
                  <span className="hack-sequencer__title">
                    {isHackingComplete ? "Access secured" : "Hack in progress"}
                  </span>
                  <span className="hack-sequencer__percentage">
                    {Math.round(hackProgress)}%
                  </span>
                </div>
                <div className="hack-sequencer__bar">
                  <div
                    className="hack-sequencer__fill"
                    style={{
                      width: `${hackProgress}%`,
                      backgroundColor:
                        hackProgress < 33
                          ? "#ff3333"
                          : hackProgress < 66
                            ? "#ffaa00"
                            : "var(--matrix-primary)",
                    }}
                  />
                </div>
                <p className="hack-sequencer__feedback">{hackFeedback}</p>
              </div>
              {/* biome-ignore lint/a11y/useSemanticElements: Matrix effect viewport acts as global button without being semantic button to preserve layout */}
              <div
                className="hack-input-viewport"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleViewportEngage();
                }}
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >
                <div className="hack-input-stream" aria-hidden="true">
                  {consoleDisplay.split("\n").map((line, i) => {
                    let className = "hack-line";
                    if (line.includes("[ERR]") || line.includes("failed"))
                      className += " error";
                    else if (line.includes("[WARN]")) className += " warn";
                    else if (
                      line.includes("[SUCCESS]") ||
                      line.includes("[OK]")
                    )
                      className += " success";
                    else if (
                      line.startsWith("thumb@sys") ||
                      line.startsWith("root@")
                    )
                      className += " prompt";

                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Log list relies on array order and does not reorder
                      <div key={i} className={className}>
                        {line}
                      </div>
                    );
                  })}
                  {showConsoleCursor && <span className="hack-input-cursor" />}
                </div>
                {isHackingComplete && successTelemetry && (
                  <output className="hack-input-success" aria-live="assertive">
                    <span className="hack-input-success__title">
                      ACCESS GRANTED
                    </span>
                    <span className="hack-input-success__meta">
                      Channel {successTelemetry.signalChannel} ·{" "}
                      {successTelemetry.runtimeDisplay}
                    </span>
                    <span className="hack-input-success__cta">
                      Press ENTER or ESC to exit
                    </span>
                  </output>
                )}
              </div>
              <input
                type="text"
                ref={hackInputRef}
                onKeyDown={handleHackKeyDown}
                onChange={handleHackInputChange}
                className="hack-input-field"
                disabled={isHackingComplete}
                aria-label="Mash the keys to amplify the breach"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby="hack-input-helper"
              />
              <div
                className="hack-input-helper"
                aria-hidden="true"
                id="hack-input-helper"
              >
                {isHackingComplete
                  ? "Channel stabilized"
                  : "Keep mashing to stabilize the signal"}
              </div>
            </div>
          </div>
        </div>
      </div>
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
