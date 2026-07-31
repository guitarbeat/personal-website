"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  dragTravelState,
  isActivationKey,
  keyboardMovementDelta,
  keyboardTravelState,
  oneshotReturnsToIdle,
  shouldBeginPointerSession,
  shouldStartHover,
} from "./companionInteractionPolicy.js";
import type { ProofPoint, ProofState } from "./types.js";

interface DragSession {
  pointerId: number;
  pointerStart: ProofPoint;
  positionStart: ProofPoint;
  lastPointerX: number;
  dragging: boolean;
}

export interface UseCompanionInteractionOptions {
  state?: ProofState;
  currentPosition: ProofPoint;
  draggable: boolean;
  dragThreshold: number;
  reactToHover: boolean;
  reactToPress: boolean;
  reduceMotion: boolean;
  commitPosition: (nextPosition: ProofPoint) => ProofPoint;
  suspendPositionTransition: () => void;
  onDragChange?: (dragging: boolean) => void;
  onStateChange?: (state: ProofState) => void;
  onPointerEnter?: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLSpanElement>) => void;
}

export interface CompanionInteractionApi {
  dragging: boolean;
  pressing: boolean;
  visibleState: ProofState;
  autonomousKey: number;
  interactive: boolean;
  beginPointer: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  movePointer: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  finishPointer: (
    event: ReactPointerEvent<HTMLSpanElement>,
    cancelled: boolean,
  ) => void;
  handlePointerEnter: (event: ReactPointerEvent<HTMLSpanElement>) => void;
  handleKeyDown: (event: ReactKeyboardEvent<HTMLSpanElement>) => void;
  handleAnimationComplete: (
    completed: ProofState,
    onAnimationComplete?: (state: ProofState) => void,
  ) => void;
}

export function useCompanionInteraction({
  state,
  currentPosition,
  draggable,
  dragThreshold,
  reactToHover,
  reactToPress,
  reduceMotion,
  commitPosition,
  suspendPositionTransition,
  onDragChange,
  onStateChange,
  onPointerEnter,
  onPointerDown,
  onPointerMove,
  onKeyDown,
}: UseCompanionInteractionOptions): CompanionInteractionApi {
  const dragRef = useRef<DragSession | null>(null);
  const keyboardTimerRef = useRef<number | null>(null);
  const autonomousStateRef = useRef<ProofState>("idle");
  const [dragging, setDragging] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [autonomousState, setAutonomousState] = useState<ProofState>("idle");
  const [autonomousKey, setAutonomousKey] = useState(0);
  const visibleState = state ?? autonomousState;
  const interactive = draggable || reactToPress;

  const updateState = (nextState: ProofState) => {
    if (state !== undefined || autonomousStateRef.current === nextState) {
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

  useEffect(() => {
    onStateChange?.(visibleState);
  }, [onStateChange, visibleState]);

  useEffect(
    () => () => {
      if (keyboardTimerRef.current !== null) {
        window.clearTimeout(keyboardTimerRef.current);
      }
    },
    [],
  );

  const beginPointer = (event: ReactPointerEvent<HTMLSpanElement>) => {
    onPointerDown?.(event);
    if (
      !shouldBeginPointerSession({
        defaultPrevented: event.defaultPrevented,
        alreadyCapturing: dragRef.current !== null,
        draggable,
        reactToPress,
        button: event.button,
        pointerType: event.pointerType,
      })
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
      updateState(dragTravelState(session.lastPointerX, event.clientX));
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
      shouldStartHover({
        defaultPrevented: event.defaultPrevented,
        reactToHover,
        pointerType: event.pointerType,
        dragging,
        reduceMotion,
      })
    ) {
      updateState("hover");
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (isActivationKey(event.key)) {
      event.preventDefault();
      if (reactToPress && !reduceMotion) {
        updateState("wave");
      }
      return;
    }

    const delta = keyboardMovementDelta(event.key);
    if (!draggable || !delta) {
      return;
    }

    event.preventDefault();
    suspendPositionTransition();
    commitPosition({
      x: currentPosition.x + delta.x,
      y: currentPosition.y + delta.y,
    });
    if (!reduceMotion && state === undefined) {
      const travel = keyboardTravelState(delta.x);
      if (travel) {
        updateState(travel);
        if (keyboardTimerRef.current !== null) {
          window.clearTimeout(keyboardTimerRef.current);
        }
        keyboardTimerRef.current = window.setTimeout(
          () => updateState("idle"),
          220,
        );
      }
    }
  };

  const handleAnimationComplete = (
    completed: ProofState,
    onAnimationComplete?: (state: ProofState) => void,
  ) => {
    onAnimationComplete?.(completed);
    if (state === undefined && oneshotReturnsToIdle(completed)) {
      updateState("idle");
    }
  };

  return {
    dragging,
    pressing,
    visibleState,
    autonomousKey,
    interactive,
    beginPointer,
    movePointer,
    finishPointer,
    handlePointerEnter,
    handleKeyDown,
    handleAnimationComplete,
  };
}
