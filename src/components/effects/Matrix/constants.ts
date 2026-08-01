// Matrix Effect Constants
// Centralized configuration for colors, timings, and other constants

export interface Color {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

// * Phosphor palette for the rain canvas. DOM chrome reads the matching CSS
// * custom properties from _matrix-variables.scss instead.
export const MATRIX_COLORS = {
  TRAIL: { r: 0, g: 255, b: 65, alpha: 1 },
  HEAD: { r: 51, g: 255, b: 102, alpha: 1 },
  HEAD_BRIGHT: { r: 220, g: 255, b: 230, alpha: 1 },
  HEAD_BLOOM: { r: 0, g: 255, b: 65, alpha: 0.85 },
} satisfies Record<string, Color>;

// * Animation Timing Constants (in milliseconds)
export const ANIMATION_TIMING = {
  // Flicker Effects
  MATRIX_FLICKER: 100,
  TERMINAL_FLICKER: 50,
  SCREEN_FLICKER: 100,

  // User Feedback
  HACK_COMPLETE_FEEDBACK_DURATION: 2000,
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

// * Z-Index Scale - Consistent Layering
export const Z_INDEX = {
  // Base layers (1000s)
  BACKGROUND: 1000,
  CANVAS: 1001,
  FEEDBACK: 1002,

  // Overlay layers (2000s)
  MODAL: 2000,
  MODAL_BACKDROP: 2001,
  MODAL_CONTENT: 2002,
  MODAL_CONTROLS: 2003,

  // Top layers (3000s)
  TOOLTIP: 3000,
  NOTIFICATION: 3001,
  DEBUG: 3002,
};

// * Performance Constants
export const PERFORMANCE = {
  // FPS Targets
  TARGET_FPS: 60,
  FRAME_INTERVAL: 1000 / 60, // ~16.67ms
};

// * Font and Sizing Constants
export const TYPOGRAPHY = {
  FONT_FAMILY: "'Courier New', 'Monaco', 'Consolas', monospace",
  FONT_SIZES: {
    MIN: 8,
    MAX: 20,
    SMALL: 10,
    MEDIUM: 11,
    LARGE: 12,
    XLARGE: 16,
    XXLARGE: 20,
    HUGE: 32,
  },
  LETTER_SPACING: {
    NORMAL: 1,
    WIDE: 2,
    WIDER: 3,
  },
};

// * Layout Constants
export const LAYOUT = {
  // Breakpoints (should match CSS media queries)
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1016,
  DESKTOP_BREAKPOINT: 1200,

  // Spacing
  PADDING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32,
  },
  MARGIN: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32,
  },

  // Border Radius
  BORDER_RADIUS: {
    NONE: 0,
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 8,
  },
};

// * Matrix Rain Effect Constants
export const MATRIX_RAIN = {
  // Character Sets
  ALPHABET:
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*",

  // Animation Properties
  SPEED_RANGE: { min: 1, max: 3 },
  TRAIL_LENGTH_RANGE: { min: 3, max: 6 },

  // Visual Effects
  BRIGHTNESS_CHANCE: 0.95,

  // Font Sizes
  FONT_SIZES: {
    MIN: 12,
    MAX: 18,
  },
};

/** Progressive rain intensity tuning (see matrixRainIntensity.ts). */
export const MATRIX_RAIN_INTENSITY = {
  BASE_INTENSITY: 0.12,
  PHASE_THRESHOLDS: {
    PHASE_1: 33,
    PHASE_2: 66,
  },
  PHASE_BOOST: 0.05,
  REDUCED_MOTION_CAP: 0.2,
  FADE_ALPHA: { min: 0.035, max: 0.07 },
  OPACITY: { min: 0.45, max: 1.0 },
  SPEED: { min: 0.75, max: 1.25 },
  BRIGHT_HEAD: { minThreshold: 0.9, maxThreshold: 0.97 },
};

/** Unlock is presentational, not a security boundary — see
 *  docs/adr/0004-matrix-unlock-is-presentational.md */
export const UNLOCK = {
  /** How long an Unlock persists before lapsing back to the blurred state. */
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
};

// * Error Messages
export const ERROR_MESSAGES = {
  STORAGE_ERROR: "Failed to save session data",
  AUDIO_ERROR: "Audio playback failed",
  CANVAS_ERROR: "Canvas rendering failed",
};

export const toRgba = ({ r, g, b, alpha }: Color): string =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

// * Performance Detection Utilities
export const PerformanceUtils = {
  // Get performance mode based on device type
  getPerformanceMode: () =>
    window.innerWidth < LAYOUT.MOBILE_BREAKPOINT ? "mobile" : "desktop",
};
