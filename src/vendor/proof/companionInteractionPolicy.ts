import type { ProofPoint, ProofState } from "./types.js";

export const KEYBOARD_STEP = 24;

const KEYBOARD_MOVEMENT: Record<string, ProofPoint> = {
  ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
  ArrowRight: { x: KEYBOARD_STEP, y: 0 },
  ArrowUp: { x: 0, y: -KEYBOARD_STEP },
  ArrowDown: { x: 0, y: KEYBOARD_STEP },
};

export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

export function keyboardMovementDelta(key: string): ProofPoint | null {
  return KEYBOARD_MOVEMENT[key] ?? null;
}

export function shouldBeginPointerSession(options: {
  defaultPrevented: boolean;
  alreadyCapturing: boolean;
  draggable: boolean;
  reactToPress: boolean;
  button: number;
  pointerType: string;
}): boolean {
  const {
    defaultPrevented,
    alreadyCapturing,
    draggable,
    reactToPress,
    button,
    pointerType,
  } = options;
  if (defaultPrevented || alreadyCapturing || (!draggable && !reactToPress)) {
    return false;
  }
  return button === 0 || pointerType === "touch";
}

export function shouldStartHover(options: {
  defaultPrevented: boolean;
  reactToHover: boolean;
  pointerType: string;
  dragging: boolean;
  reduceMotion: boolean;
}): boolean {
  const {
    defaultPrevented,
    reactToHover,
    pointerType,
    dragging,
    reduceMotion,
  } = options;
  return (
    !defaultPrevented &&
    reactToHover &&
    pointerType !== "touch" &&
    !dragging &&
    !reduceMotion
  );
}

export function dragTravelState(
  previousClientX: number,
  nextClientX: number,
): ProofState {
  if (nextClientX === previousClientX) {
    return "idle";
  }
  return nextClientX < previousClientX ? "move-left" : "move-right";
}

export function keyboardTravelState(deltaX: number): ProofState | null {
  if (deltaX === 0) {
    return null;
  }
  return deltaX < 0 ? "move-left" : "move-right";
}

export function oneshotReturnsToIdle(state: ProofState): boolean {
  return state === "lowering" || state === "wave" || state === "error";
}
