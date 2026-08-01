/** Difficulty tuning for an Attempt: how fast progress bleeds away and how
 *  much key variety the player needs to keep it climbing. */

/** Hack progress every Attempt opens on. */
export const ATTEMPT_START_PROGRESS = 12;

export const PROGRESS_DECAY_INTERVAL = 140;
export const PROGRESS_DECAY_BASE = 0.5;
export const PROGRESS_DECAY_RAMP = [
  { threshold: 2600, value: 1.2 },
  { threshold: 1900, value: 0.9 },
  { threshold: 1300, value: 0.65 },
  { threshold: 900, value: 0.45 },
];
export const MIN_IDLE_BEFORE_DECAY = 300;
export const KEY_VARIETY_WINDOW = 12;
export const REPETITION_DECAY_RESET_MS = 650;

/** Cap on Console length so the buffer cannot grow without bound. */
export const MAX_DISPLAY_LENGTH = 1400;
