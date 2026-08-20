/**
 * Minimal logger utility wrapping the standard console.
 * Centralizes logging to allow easy integration with real logging services later.
 */
export const logger = {
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  info: (...args: unknown[]) => {
    console.info(...args);
  },
  log: (...args: unknown[]) => {
    console.log(...args);
  }
};
