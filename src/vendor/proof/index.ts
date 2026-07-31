"use client";

export { Proof } from "./Proof.js";
export { ProofCompanion } from "./ProofCompanion.js";
export {
  animationFrame,
  frameBackgroundPosition,
  proofAnimations,
  proofAtlas,
  type ProofAnimation,
} from "./atlas.js";
export {
  directionFrame,
  directionIndexForVector,
  directionIndexWithHysteresis,
  PROOF_DIRECTION_STEP,
} from "./gaze.js";
export type {
  ProofCompanionProps,
  ProofCompanionSpriteProps,
  ProofFrame,
  ProofPlacement,
  ProofPoint,
  ProofProps,
  ProofState,
  ReducedMotionPreference,
} from "./types.js";
