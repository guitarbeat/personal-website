import { MATRIX_RAIN_INTENSITY } from "./constants";
import { ATTEMPT_START_PROGRESS } from "./hackTuning";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

/** Smooth ease-out curve for progressive rain ramp. */
const easeOut = (t: number) => 1 - (1 - t) ** 2;

export interface MatrixRainDrawParams {
  fadeAlpha: number;
  opacityMultiplier: number;
  speedMultiplier: number;
  brightHeadThreshold: number;
}

/** Maps hack progress (0–100) to normalized rain intensity (0–1). */
export function getMatrixRainIntensity(progress: number): number {
  const range = 100 - ATTEMPT_START_PROGRESS;
  const t = clamp((progress - ATTEMPT_START_PROGRESS) / range, 0, 1);
  let intensity = lerp(MATRIX_RAIN_INTENSITY.BASE_INTENSITY, 1, easeOut(t));

  if (progress >= MATRIX_RAIN_INTENSITY.PHASE_THRESHOLDS.PHASE_2) {
    intensity += MATRIX_RAIN_INTENSITY.PHASE_BOOST;
  } else if (progress >= MATRIX_RAIN_INTENSITY.PHASE_THRESHOLDS.PHASE_1) {
    intensity += MATRIX_RAIN_INTENSITY.PHASE_BOOST * 0.5;
  }

  return clamp(intensity, 0, 1);
}

/** Derive per-frame canvas draw parameters from normalized intensity. */
export function getMatrixRainDrawParams(
  intensity: number,
): MatrixRainDrawParams {
  const t = clamp(intensity, 0, 1);
  const { FADE_ALPHA, OPACITY, SPEED, BRIGHT_HEAD } = MATRIX_RAIN_INTENSITY;

  return {
    fadeAlpha: lerp(FADE_ALPHA.max, FADE_ALPHA.min, t),
    opacityMultiplier: lerp(OPACITY.min, OPACITY.max, t),
    speedMultiplier: lerp(SPEED.min, SPEED.max, t),
    brightHeadThreshold: lerp(
      BRIGHT_HEAD.maxThreshold,
      BRIGHT_HEAD.minThreshold,
      t,
    ),
  };
}

/** Cap intensity for prefers-reduced-motion users. */
export function getReducedMotionRainIntensity(): number {
  return MATRIX_RAIN_INTENSITY.REDUCED_MOTION_CAP;
}
