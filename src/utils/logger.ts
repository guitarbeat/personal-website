/**
 * Centralized logger utility for the application.
 * Provides a clean interface for logging that can be extended later
 * (e.g., sending logs to a remote service like Sentry or DataDog).
 */

export const logger = {
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
};
