/**
 * Simple logger utility to wrap console methods.
 * This can be easily extended later to send logs to a remote service.
 */
export const logger = {
  info: (...args: unknown[]) => {
    console.info(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
