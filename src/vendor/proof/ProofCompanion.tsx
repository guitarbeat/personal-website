"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  clampToViewport,
  companionWidth,
  currentViewportGeometry,
  DEFAULT_COMPANION_SIZE,
  normalizeCompanionSize,
  repositionForGeometry,
  samePoint,
  viewportPosition,
  type ViewportGeometry,
} from "./companionGeometry.js";
import { Proof } from "./Proof.js";
import type {
  ProofCompanionProps,
  ProofPoint,
  ProofState,
} from "./types.js";
import { useReducedMotion } from "./useReducedMotion.js";

const DEFAULT_STORAGE_KEY = "proof-companion-position";
const KEYBOARD_STEP = 24;
const POSITION_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
const DIRECT_FEEDBACK_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface DragSession {
  pointerId: number;
  pointerStart: ProofPoint;
  positionStart: ProofPoint;
  lastPointerX: number;
  dragging: boolean;
}

function readStoredPosition(storageKey: string): ProofPoint | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as Partial<ProofPoint>;
    return Number.isFinite(parsed.x) && Number.isFinite(parsed.y)
      ? { x: Number(parsed.x), y: Number(parsed.y) }
      : null;
  } catch {
    return null;
  }
}

function writeStoredPosition(storageKey: string, point: ProofPoint): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(point));
  } catch {
    // Storage can be unavailable in sandboxed embeds. Positioning still works.
  }
}

export function ProofCompanion({
  state,
  size = DEFAULT_COMPANION_SIZE,
  position,
  defaultPosition,
  placement = "bottom-right",
  inset = 24,
  draggable = true,
  dragThreshold = 6,
  persistPosition = false,
  storageKey = DEFAULT_STORAGE_KEY,
  followCursor = true,
  reactToHover = true,
  reactToPress = true,
  gazeDeadzone = 32,
  gazeHysteresis = 4,
  spriteUrl,
  paused = false,
  reducedMotion = "system",
  animationKey = 0,
  showShadow = true,
  spriteStyle,
  onPositionChange,
  onDragChange,
  onStateChange,
  onAnimationComplete,
  onPointerEnter,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  style,
  role,
  tabIndex,
  "aria-label": ariaLabel = "Proof, interactive pixel companion",
  ...spanProps
}: ProofCompanionProps) {
  const resolvedSize = normalizeCompanionSize(size);
  const reduceMotion = useReducedMotion(reducedMotion);
  const dragRef = useRef<DragSession | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const geometryRef = useRef<ViewportGeometry | null>(null);
  const initializedRef = useRef(false);
  const keyboardTimerRef = useRef<number | null>(null);
  const lastControlledPositionRef = useRef<ProofPoint | undefined>(position);
  const requestedPositionRef = useRef<ProofPoint | null>(null);
  const autonomousStateRef = useRef<ProofState>("idle");
  const [ready, setReady] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [positionTransitionSuppressed, setPositionTransitionSuppressed] =
    useState(false);
  const [internalPosition, setInternalPosition] = useState<ProofPoint>(
    defaultPosition ?? { x: inset, y: inset },
  );
  const [autonomousState, setAutonomousState] =
    useState<ProofState>("idle");
  const [autonomousKey, setAutonomousKey] = useState(0);
  const visibleState = state ?? autonomousState;
  const currentPosition = position ?? internalPosition;
  const currentPositionRef = useRef(currentPosition);
  currentPositionRef.current = currentPosition;
  if (position === undefined) {
    lastControlledPositionRef.current = undefined;
    requestedPositionRef.current = null;
  } else if (
    lastControlledPositionRef.current === undefined ||
    !samePoint(lastControlledPositionRef.current, position)
  ) {
    lastControlledPositionRef.current = position;
    requestedPositionRef.current = null;
  }
  const interactive = draggable || reactToPress;
  const resizing =
    geometryRef.current !== null &&
    geometryRef.current.size !== resolvedSize;

  const updateState = (nextState: ProofState) => {
    if (
      state !== undefined ||
      autonomousStateRef.current === nextState
    ) {
      return;
    }
    autonomousStateRef.current = nextState;
    setAutonomousState(nextState);
    setAutonomousKey((current) => current + 1);
  };

  const updateDragging = (nextDragging: boolean) => {
    setDragging(nextDragging);
    onDragChange?.(nextDragging);
  };

  const suspendPositionTransition = useCallback(() => {
    setPositionTransitionSuppressed(true);
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }
    transitionFrameRef.current = window.requestAnimationFrame(() => {
      transitionFrameRef.current = null;
      setPositionTransitionSuppressed(false);
    });
  }, []);

  const commitPosition = useCallback(
    (nextPosition: ProofPoint) => {
      const clamped = clampToViewport(nextPosition, resolvedSize, inset);
      const comparisonPosition =
        position === undefined
          ? currentPositionRef.current
          : requestedPositionRef.current ?? currentPositionRef.current;
      if (samePoint(comparisonPosition, clamped)) {
        return clamped;
      }

      if (position === undefined) {
        currentPositionRef.current = clamped;
        setInternalPosition(clamped);
        if (persistPosition) {
          writeStoredPosition(storageKey, clamped);
        }
      } else {
        requestedPositionRef.current = clamped;
      }
      onPositionChange?.(clamped);
      return clamped;
    },
    [
      inset,
      onPositionChange,
      persistPosition,
      position,
      resolvedSize,
      storageKey,
    ],
  );

  useIsomorphicLayoutEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    const stored = persistPosition ? readStoredPosition(storageKey) : null;
    const initial =
      position ??
      stored ??
      defaultPosition ??
      viewportPosition(placement, resolvedSize, inset);
    const clamped = clampToViewport(initial, resolvedSize, inset);
    if (position === undefined) {
      currentPositionRef.current = clamped;
      setInternalPosition(clamped);
    }
    geometryRef.current = currentViewportGeometry(resolvedSize, inset);
    setReady(true);
  }, [
    defaultPosition,
    inset,
    persistPosition,
    placement,
    position,
    resolvedSize,
    storageKey,
  ]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const requestId = window.requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => window.cancelAnimationFrame(requestId);
  }, [ready]);

  useIsomorphicLayoutEffect(() => {
    if (!ready) {
      return;
    }
    const nextGeometry = currentViewportGeometry(resolvedSize, inset);
    const previousGeometry = geometryRef.current;
    geometryRef.current = nextGeometry;
    if (!previousGeometry) {
      return;
    }
    const adjustedPosition = repositionForGeometry(
      currentPositionRef.current,
      previousGeometry,
      nextGeometry,
    );
    if (!samePoint(currentPositionRef.current, adjustedPosition)) {
      suspendPositionTransition();
      commitPosition(adjustedPosition);
    }
  }, [
    commitPosition,
    inset,
    ready,
    resolvedSize,
    suspendPositionTransition,
  ]);

  useEffect(() => {
    const handleResize = () => {
      const nextGeometry = currentViewportGeometry(resolvedSize, inset);
      const previousGeometry = geometryRef.current ?? nextGeometry;
      geometryRef.current = nextGeometry;
      const adjustedPosition = repositionForGeometry(
        currentPositionRef.current,
        previousGeometry,
        nextGeometry,
      );
      if (!samePoint(currentPositionRef.current, adjustedPosition)) {
        suspendPositionTransition();
        commitPosition(adjustedPosition);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [
    commitPosition,
    inset,
    resolvedSize,
    suspendPositionTransition,
  ]);

  useEffect(() => {
    onStateChange?.(visibleState);
  }, [onStateChange, visibleState]);

  useEffect(
    () => () => {
      if (keyboardTimerRef.current !== null) {
        window.clearTimeout(keyboardTimerRef.current);
      }
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }
    },
    [],
  );

  const beginPointer = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerDown?.(event);
    if (
      event.defaultPrevented ||
      dragRef.current !== null ||
      (!draggable && !reactToPress) ||
      (event.button !== 0 && event.pointerType !== "touch")
    ) {
      return;
    }

    setPressing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      pointerStart: { x: event.clientX, y: event.clientY },
      positionStart: currentPosition,
      lastPointerX: event.clientX,
      dragging: false,
    };
  };

  const movePointer = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerMove?.(event);
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - session.pointerStart.x;
    const dy = event.clientY - session.pointerStart.y;
    if (
      draggable &&
      !session.dragging &&
      Math.hypot(dx, dy) >= dragThreshold
    ) {
      session.dragging = true;
      setPressing(false);
      updateDragging(true);
    }
    if (!session.dragging) {
      return;
    }

    commitPosition({
      x: session.positionStart.x + dx,
      y: session.positionStart.y + dy,
    });
    if (!reduceMotion && state === undefined) {
      if (event.clientX === session.lastPointerX) {
        updateState("idle");
      } else {
        updateState(
          event.clientX < session.lastPointerX ? "move-left" : "move-right",
        );
      }
    }
    session.lastPointerX = event.clientX;
  };

  const finishPointer = (
    event: ReactPointerEvent<HTMLSpanElement>,
    cancelled: boolean,
  ) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setPressing(false);
    if (session.dragging) {
      updateDragging(false);
      updateState("idle");
    } else if (
      !cancelled &&
      !event.defaultPrevented &&
      reactToPress &&
      !reduceMotion
    ) {
      updateState("wave");
    }
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerEnter?.(event);
    if (
      !event.defaultPrevented &&
      reactToHover &&
      event.pointerType !== "touch" &&
      !dragging &&
      !reduceMotion
    ) {
      updateState("hover");
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (reactToPress && !reduceMotion) {
        updateState("wave");
      }
      return;
    }

    const movement: Record<string, ProofPoint> = {
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
    };
    const delta = movement[event.key];
    if (!draggable || !delta) {
      return;
    }

    event.preventDefault();
    suspendPositionTransition();
    commitPosition({
      x: currentPosition.x + delta.x,
      y: currentPosition.y + delta.y,
    });
    if (!reduceMotion && state === undefined && delta.x !== 0) {
      updateState(delta.x < 0 ? "move-left" : "move-right");
      if (keyboardTimerRef.current !== null) {
        window.clearTimeout(keyboardTimerRef.current);
      }
      keyboardTimerRef.current = window.setTimeout(
        () => updateState("idle"),
        220,
      );
    }
  };

  const wrapperStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    display: "inline-block",
    width: companionWidth(resolvedSize),
    height: resolvedSize,
    opacity: ready ? 1 : 0,
    transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
    transition:
      dragging ||
      reduceMotion ||
      resizing ||
      positionTransitionSuppressed
        ? "none"
        : motionReady
          ? `transform 220ms ${POSITION_EASING}, opacity 180ms ${POSITION_EASING}`
          : `opacity 180ms ${POSITION_EASING}`,
    touchAction: "none",
    userSelect: "none",
    cursor: draggable
      ? dragging
        ? "grabbing"
        : "grab"
      : reactToPress
        ? "pointer"
        : "default",
    willChange: "transform",
    ...style,
  };

  return (
    <span
      {...spanProps}
      aria-label={ariaLabel}
      role={role ?? (interactive ? "button" : "img")}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      data-proof-companion=""
      data-proof-dragging={dragging ? "true" : "false"}
      data-proof-pressed={pressing ? "true" : "false"}
      data-proof-size={resolvedSize}
      data-proof-x={Math.round(currentPosition.x)}
      data-proof-y={Math.round(currentPosition.y)}
      onPointerEnter={handlePointerEnter}
      onPointerDown={beginPointer}
      onPointerMove={movePointer}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        finishPointer(event, event.defaultPrevented);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        finishPointer(event, true);
      }}
      onKeyDown={handleKeyDown}
      style={wrapperStyle}
    >
      {showShadow ? (
        <span
          aria-hidden="true"
          data-proof-shadow=""
          style={{
            position: "absolute",
            right: "14%",
            bottom: "1%",
            left: "14%",
            zIndex: 0,
            height: "4%",
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.3)",
            filter: "blur(5px)",
            opacity: dragging ? 0.72 : pressing ? 0.88 : 1,
            transform: dragging
              ? "scaleX(0.82)"
              : pressing
                ? "scaleX(0.92)"
                : "scaleX(1)",
            transition: reduceMotion
              ? "none"
              : `opacity 140ms ${DIRECT_FEEDBACK_EASING}, transform 140ms ${DIRECT_FEEDBACK_EASING}`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <Proof
        aria-hidden
        animationKey={`${animationKey}:${autonomousKey}`}
        followCursor={followCursor}
        gazeDeadzone={gazeDeadzone}
        gazeHysteresis={gazeHysteresis}
        paused={paused}
        reactToHover={false}
        reactToPress={false}
        reducedMotion={reducedMotion}
        size={resolvedSize}
        spriteUrl={spriteUrl}
        state={visibleState}
        style={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "none",
          filter: dragging
            ? "drop-shadow(0 18px 14px rgba(0, 0, 0, 0.24))"
            : pressing
              ? "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.16))"
              : "drop-shadow(0 10px 12px rgba(0, 0, 0, 0.18))",
          transformOrigin: "50% 100%",
          transition: reduceMotion
            ? "none"
            : `filter 140ms ${DIRECT_FEEDBACK_EASING}, transform 140ms ${DIRECT_FEEDBACK_EASING}`,
          transform: dragging
            ? "translate3d(0, -4px, 0)"
            : pressing
              ? "translate3d(0, 2px, 0) scale(0.985)"
              : "translate3d(0, 0, 0)",
          ...spriteStyle,
        }}
        onAnimationComplete={(completed) => {
          onAnimationComplete?.(completed);
          if (
            state === undefined &&
            (completed === "hover" ||
              completed === "wave" ||
              completed === "error")
          ) {
            updateState("idle");
          }
        }}
      />
    </span>
  );
}
