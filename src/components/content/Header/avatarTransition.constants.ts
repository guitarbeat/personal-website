/** Worst case: shrink → slideOut → slideIn → expand. */
export const AVATAR_MAX_PHASE_COUNT = 4;

/** Matches `--avatar-phase-duration` in header.scss (0.35s) * max phases. */
export const AVATAR_TRANSITION_FALLBACK_MS = 350 * AVATAR_MAX_PHASE_COUNT;
