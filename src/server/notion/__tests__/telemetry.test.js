import { createErrorPayload } from "../../notionContent";

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
});
