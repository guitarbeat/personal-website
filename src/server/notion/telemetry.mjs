export function sanitizeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error !== null &&
    (typeof error === "object" || typeof error === "function")
  ) {
    if (typeof error.message === "string") {
      return error.message;
    }
    return Object.prototype.toString.call(error);
  }
  return String(error);
}

import { ContentError } from "./constants.mjs";

export function buildStructuredLog(event, telemetry) {
  return JSON.stringify({
    event,
    ...telemetry,
  });
}

export function createErrorPayload(error) {
  if (error instanceof ContentError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        failureType: error.failureType,
      },
    };
  }

  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      failureType: "internal_server_error",
    },
  };
}
