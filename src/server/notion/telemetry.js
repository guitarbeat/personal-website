import { ContentError } from "./constants.js";

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
