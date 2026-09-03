import { createErrorPayload, sanitizeErrorMessage } from "../index.mjs";

describe("notion telemetry", () => {
  it("sanitizes public error payloads", () => {
    const payload = createErrorPayload(
      new Error("upstream details should stay private"),
    );

    expect(payload).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        failureType: "internal_server_error",
      },
    });
  });

  describe("sanitizeErrorMessage raw object safety", () => {
    it("extracts message property from raw object and omits extra fields", () => {
      expect(
        sanitizeErrorMessage({
          message: "Raw object error",
          secret: "sensitive",
        }),
      ).toBe("Raw object error");
    });

    it("returns [object Object] for raw objects without message property", () => {
      expect(sanitizeErrorMessage({ secret: "sensitive" })).toBe(
        "[object Object]",
      );
    });

    it("does not invoke custom toString on raw objects", () => {
      expect(sanitizeErrorMessage({ toString: () => "secret=123" })).toBe(
        "[object Object]",
      );
    });
  });
});
