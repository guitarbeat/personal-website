// Matrix Effect Constants
// Centralized configuration for colors, timings, and other constants

// * Animation Timing Constants (in milliseconds)
export const ANIMATION_TIMING = {
  // Flicker Effects
  MATRIX_FLICKER: 100,
  TERMINAL_FLICKER: 50,
  SCREEN_FLICKER: 100,

  // User Feedback
  SUCCESS_FEEDBACK_DURATION: 2000,
  MATRIX_MODAL_CLOSE_DELAY: 2000,
  FADE_IN_DURATION: 600,
  FADE_OUT_DURATION: 300,

  // Interactive Effects
  HOVER_TRANSITION: 300,
  FOCUS_TRANSITION: 200,
  GLITCH_DURATION: 200,

  // Performance Monitoring
  FPS_UPDATE_INTERVAL: 1000,
  MOUSE_TRAIL_UPDATE: 50,
  RATE_LIMIT_CHECK: 1000,
};

// * Security Constants
export const SECURITY = {
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_MS: 30 * 60 * 1000, // 30 minutes
  },
  SESSION: {
    DURATION_MS: 60 * 60 * 1000, // 1 hour
  },
};

// * Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  SESSION_EXPIRED: "Session expired. Please authenticate again.",
  STORAGE_ERROR: "Failed to save session data",
  AUDIO_ERROR: "Audio playback failed",
  CANVAS_ERROR: "Canvas rendering failed",
};
