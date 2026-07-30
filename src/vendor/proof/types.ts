import type { CSSProperties, HTMLAttributes } from "react";

export type ProofState =
  | "idle"
  | "move-right"
  | "move-left"
  | "wave"
  | "hover"
  | "error"
  | "waiting"
  | "working"
  | "review";

export type ReducedMotionPreference = "system" | "always" | "never";

export interface ProofPoint {
  x: number;
  y: number;
}

export type ProofPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ProofProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Controlled animation state. Omit it to use Proof's autonomous reactions. */
  state?: ProofState;
  /** Rendered height in CSS pixels. */
  size?: number;
  /** Make an idle Proof look toward the page pointer. */
  followCursor?: boolean;
  /** Play Proof's warm nod when the pointer enters him in autonomous mode. */
  reactToHover?: boolean;
  /** Make an autonomous Proof wave when pressed. */
  reactToPress?: boolean;
  /** Radius around Proof's center where he keeps his neutral idle animation. */
  gazeDeadzone?: number;
  /** Extra degrees required before gaze crosses into an adjacent direction. */
  gazeHysteresis?: number;
  /** Override the bundled canonical spritesheet URL. */
  spriteUrl?: string;
  /** Freeze the current animation frame. */
  paused?: boolean;
  /** Control how continuous animation responds to reduced-motion preferences. */
  reducedMotion?: ReducedMotionPreference;
  /** Change this value to restart the same controlled one-shot animation. */
  animationKey?: string | number;
  /** Called when a non-looping controlled or autonomous action completes. */
  onAnimationComplete?: (state: ProofState) => void;
}

export interface ProofFrame {
  row: number;
  column: number;
}

export interface ProofCompanionProps
  extends Omit<
    HTMLAttributes<HTMLSpanElement>,
    "children" | "onAnimationStart" | "onAnimationEnd"
  > {
  /** Controlled animation state. Omit it for Codex-like autonomous behavior. */
  state?: ProofState;
  /**
   * Rendered sprite height in CSS pixels. Runtime changes preserve a pinned
   * viewport edge or the companion's visual center.
   */
  size?: number;
  /** Controlled viewport position for the companion's top-left corner. */
  position?: ProofPoint;
  /** Initial uncontrolled position. Placement is used when this is omitted. */
  defaultPosition?: ProofPoint;
  /** Viewport corner used for the initial uncontrolled position. */
  placement?: ProofPlacement;
  /** Distance from viewport edges when placed or clamped. */
  inset?: number;
  /** Allow pointer and keyboard dragging within the viewport. */
  draggable?: boolean;
  /** Minimum pointer travel before a press becomes a drag. */
  dragThreshold?: number;
  /** Remember an uncontrolled position in localStorage. */
  persistPosition?: boolean;
  /** localStorage key used when position persistence is enabled. */
  storageKey?: string;
  /** Make idle Proof look toward the page pointer. */
  followCursor?: boolean;
  /** Play the warm hover acknowledgment in autonomous mode. */
  reactToHover?: boolean;
  /** Play a wave after an un-dragged press in autonomous mode. */
  reactToPress?: boolean;
  /** Radius around Proof's center where he keeps his neutral idle animation. */
  gazeDeadzone?: number;
  /** Extra degrees required before gaze crosses into an adjacent direction. */
  gazeHysteresis?: number;
  /** Override the bundled canonical spritesheet URL. */
  spriteUrl?: string;
  /** Freeze sprite animation. */
  paused?: boolean;
  /** Control continuous motion and settling behavior. */
  reducedMotion?: ReducedMotionPreference;
  /** Change this value to restart the same controlled animation. */
  animationKey?: string | number;
  /** Show the soft grounding shadow used by the companion wrapper. */
  showShadow?: boolean;
  /** Styles applied to the inner Proof sprite. */
  spriteStyle?: CSSProperties;
  /** Called after a position change caused by drag, keyboard, or resize. */
  onPositionChange?: (position: ProofPoint) => void;
  /** Called whenever dragging starts or ends. */
  onDragChange?: (dragging: boolean) => void;
  /** Called when the visible state changes. */
  onStateChange?: (state: ProofState) => void;
  /** Called when a non-looping action completes. */
  onAnimationComplete?: (state: ProofState) => void;
}
