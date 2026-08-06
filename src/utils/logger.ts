export const Logger = {
  warn: (message: string, ...args: unknown[]) => {
    // Suppress noisy warnings in test environment unless specifically needed
    if (process.env.NODE_ENV !== "test") {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.error(message, ...args);
    }
  },
};
