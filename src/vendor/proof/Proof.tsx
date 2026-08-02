"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  animationFrame,
  frameBackgroundPosition,
  proofAnimations,
  proofAtlas,
} from "./atlas.js";
import { directionFrame, directionIndexWithHysteresis } from "./gaze.js";
import { subscribeToPointer } from "./pointer.js";
import type { ProofFrame, ProofProps, ProofState } from "./types.js";
import { useReducedMotion } from "./useReducedMotion.js";

const canonicalSpriteUrl = new URL(
  "./assets/spritesheet.webp",
  import.meta.url,
).href;

export function Proof({
  state,
  size = 208,
  followCursor = true,
  reactToHover = true,
  reactToPress = true,
  gazeDeadzone = 32,
  gazeHysteresis = 4,
  spriteUrl = canonicalSpriteUrl,
  paused = false,
  reducedMotion = "system",
  animationKey = 0,
  onAnimationComplete,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  style,
  role,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  ...spanProps
}: ProofProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const completionRef = useRef(onAnimationComplete);
  const gazeRequestRef = useRef<number | null>(null);
  const gazeDirectionRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef(false);
  const pressCycleRef = useRef(false);
  const pressTimerRef = useRef<number | null>(null);
  const [autonomousState, setAutonomousState] = useState<ProofState>("idle");
  const [frameIndex, setFrameIndex] = useState(0);
  const [gazeFrame, setGazeFrame] = useState<ProofFrame | null>(null);
  const effectiveState = state ?? autonomousState;
  const reduceMotion = useReducedMotion(reducedMotion);
  const animation = proofAnimations[effectiveState];

  completionRef.current = onAnimationComplete;

  useEffect(() => {
    setFrameIndex(0);
  }, [animationKey, effectiveState]);

  useEffect(() => {
    if (paused || reduceMotion) {
      return;
    }

    const totalDuration = animation.durations.reduce(
      (total, duration) => total + duration,
      0,
    );
    let requestId = 0;
    let startedAt: number | null = null;
    let completed = false;

    const tick = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;

      if (!animation.loop && elapsed >= totalDuration) {
        setFrameIndex(animation.columns.length - 1);
        if (!completed) {
          completed = true;
          completionRef.current?.(effectiveState);
          if (state === undefined) {
            if (effectiveState === "hover") {
              if (hoveredRef.current) {
                setAutonomousState("standing");
              } else if (pressCycleRef.current) {
                setAutonomousState("standing");
                pressTimerRef.current = window.setTimeout(() => {
                  setAutonomousState("lowering");
                  pressTimerRef.current = null;
                }, 500);
              } else {
                setAutonomousState("lowering");
              }
            } else if (effectiveState === "lowering") {
              pressCycleRef.current = false;
              setAutonomousState("idle");
            } else {
              setAutonomousState("idle");
            }
          }
        }
        return;
      }

      const position = animation.loop ? elapsed % totalDuration : elapsed;
      let boundary = 0;
      let nextFrame = 0;
      for (let index = 0; index < animation.durations.length; index += 1) {
        boundary += animation.durations[index] ?? 0;
        if (position < boundary) {
          nextFrame = index;
          break;
        }
      }
      setFrameIndex((current) =>
        current === nextFrame ? current : nextFrame,
      );
      requestId = window.requestAnimationFrame(tick);
    };

    requestId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(requestId);
  }, [animation, animationKey, effectiveState, paused, reduceMotion, state]);

  useEffect(
    () => () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!followCursor || effectiveState !== "standing") {
      gazeDirectionRef.current = null;
      setGazeFrame(null);
      return;
    }

    const updateGaze = () => {
      gazeRequestRef.current = null;
      const element = rootRef.current;
      if (!element) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      const dx = latestPointerRef.current.x - (bounds.left + bounds.width / 2);
      const dy = latestPointerRef.current.y - (bounds.top + bounds.height / 2);
      if (Math.hypot(dx, dy) <= gazeDeadzone) {
        gazeDirectionRef.current = null;
        setGazeFrame(null);
        return;
      }

      const nextDirection = directionIndexWithHysteresis(
        dx,
        dy,
        gazeDirectionRef.current,
        gazeHysteresis,
      );
      gazeDirectionRef.current = nextDirection;
      const nextFrame = directionFrame(nextDirection);
      setGazeFrame((current) =>
        current?.row === nextFrame.row &&
        current.column === nextFrame.column
          ? current
          : nextFrame,
      );
    };

    const unsubscribe = subscribeToPointer((x, y) => {
      latestPointerRef.current = { x, y };
      if (gazeRequestRef.current === null) {
        gazeRequestRef.current = window.requestAnimationFrame(updateGaze);
      }
    });

    return () => {
      unsubscribe();
      if (gazeRequestRef.current !== null) {
        window.cancelAnimationFrame(gazeRequestRef.current);
        gazeRequestRef.current = null;
      }
    };
  }, [effectiveState, followCursor, gazeDeadzone, gazeHysteresis]);

  const frame =
    effectiveState === "standing" && gazeFrame
      ? gazeFrame
      : animationFrame(effectiveState, frameIndex);
  const width = size * (proofAtlas.cellWidth / proofAtlas.cellHeight);
  const spriteStyle: CSSProperties = {
    display: "inline-block",
    flex: "0 0 auto",
    width,
    height: size,
    backgroundImage: `url("${spriteUrl}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${proofAtlas.columns * 100}% ${proofAtlas.rows * 100}%`,
    backgroundPosition: frameBackgroundPosition(frame),
    imageRendering: "pixelated",
    touchAction: "manipulation",
    userSelect: "none",
    ...style,
  };

  const trigger = (nextState: ProofState) => {
    if (state === undefined && !reduceMotion) {
      setAutonomousState(nextState);
    }
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerEnter?.(event);
    if (
      !event.defaultPrevented &&
      event.pointerType !== "touch" &&
      reactToHover
    ) {
      hoveredRef.current = true;
      pressCycleRef.current = false;
      trigger("hover");
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerLeave?.(event);
    hoveredRef.current = false;
    if (
      !event.defaultPrevented &&
      state === undefined &&
      autonomousState === "standing"
    ) {
      trigger("lowering");
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerDown?.(event);
    if (!event.defaultPrevented && reactToPress) {
      if (!hoveredRef.current) {
        pressCycleRef.current = true;
      }
      trigger("hover");
    }
  };

  return (
    <span
      {...spanProps}
      ref={rootRef}
      aria-hidden={ariaHidden ?? (ariaLabel || role ? undefined : true)}
      aria-label={ariaLabel}
      role={role ?? (ariaLabel ? "img" : undefined)}
      data-proof-sprite=""
      data-proof-state={effectiveState}
      data-proof-row={frame.row}
      data-proof-column={frame.column}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      style={spriteStyle}
    />
  );
}
