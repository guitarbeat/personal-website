/** Matches `--avatar-phase-duration` in header.scss (0.35s). */
export const AVATAR_PHASE_DURATION_MS = 350;

/** Worst case: shrink → slideOut → slideIn → expand. */
export const AVATAR_MAX_PHASE_COUNT = 4;

export const AVATAR_TRANSITION_FALLBACK_MS =
  AVATAR_PHASE_DURATION_MS * AVATAR_MAX_PHASE_COUNT;
