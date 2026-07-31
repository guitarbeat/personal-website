"use client";

import {
  DEFAULT_COMPANION_SIZE,
  normalizeCompanionSize,
} from "./companionGeometry.js";
import {
  companionChromePhase,
  companionShadowStyle,
  companionSpriteStyle,
  companionWrapperStyle,
} from "./companionChrome.js";
import { Proof } from "./Proof.js";
import type { ProofCompanionProps } from "./types.js";
import { useCompanionInteraction } from "./useCompanionInteraction.js";
import { useCompanionPosition } from "./useCompanionPosition.js";
import { useReducedMotion } from "./useReducedMotion.js";

const DEFAULT_STORAGE_KEY = "proof-companion-position";

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
  const {
    ready,
    motionReady,
    currentPosition,
    resizing,
    positionTransitionSuppressed,
    commitPosition,
    suspendPositionTransition,
  } = useCompanionPosition({
    size: resolvedSize,
    position,
    defaultPosition,
    placement,
    inset,
    persistPosition,
    storageKey,
    onPositionChange,
  });
  const {
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
  } = useCompanionInteraction({
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
  });

  const phase = companionChromePhase({
    ready,
    motionReady,
    dragging,
    pressing,
  });
  const geometryAdjusting = resizing || positionTransitionSuppressed;

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
      style={companionWrapperStyle({
        size: resolvedSize,
        position: currentPosition,
        phase,
        reduceMotion,
        geometryAdjusting,
        motionReady,
        draggable,
        reactToPress,
        style,
      })}
    >
      {showShadow ? (
        <span
          aria-hidden="true"
          data-proof-shadow=""
          style={companionShadowStyle({ phase, reduceMotion })}
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
        style={companionSpriteStyle({ phase, reduceMotion, spriteStyle })}
        onAnimationComplete={(completed) => {
          handleAnimationComplete(completed, onAnimationComplete);
        }}
      />
    </span>
  );
}
