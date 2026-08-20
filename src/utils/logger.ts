/**
 * * Minimal shared logger utility
 *
 * Provides a thin wrapper around console methods to improve code health
 * by standardizing log outputs and avoiding direct console statements
 * which are often flagged by linters.
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
  log: (...args: unknown[]) => {
    console.log(...args);
  },
};
