import type { ProofFrame } from "./types.js";

export const PROOF_DIRECTION_STEP = 22.5;

function clockwiseDegreesForVector(dx: number, dy: number): number {
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

/**
 * Return Proof's clockwise gaze index: 0 is up, 4 is right, 8 is down,
 * and 12 is left.
 */
export function directionIndexForVector(dx: number, dy: number): number {
  const clockwiseDegrees = clockwiseDegreesForVector(dx, dy);
  return Math.round(clockwiseDegrees / PROOF_DIRECTION_STEP) % 16;
}

/**
 * Quantize a gaze vector while requiring a small extra angular movement before
 * leaving the current direction. This prevents cursor jitter at 22.5° borders.
 */
export function directionIndexWithHysteresis(
  dx: number,
  dy: number,
  currentDirection: number | null,
  hysteresisDegrees = 4,
): number {
  const candidate = directionIndexForVector(dx, dy);
  if (currentDirection === null) {
    return candidate;
  }

  const current = ((Math.round(currentDirection) % 16) + 16) % 16;
  const currentCenter = current * PROOF_DIRECTION_STEP;
  const holdAngle =
    PROOF_DIRECTION_STEP / 2 + Math.max(0, hysteresisDegrees);
  return angularDistance(clockwiseDegreesForVector(dx, dy), currentCenter) <=
    holdAngle
    ? current
    : candidate;
}

export function directionFrame(directionIndex: number): ProofFrame {
  const normalized = ((Math.round(directionIndex) % 16) + 16) % 16;
  return normalized < 8
    ? { row: 9, column: normalized }
    : { row: 10, column: normalized - 8 };
}
