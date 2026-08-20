import { act, renderHook } from "@testing-library/react";
import { useVFXEffect } from "../useVFXEffect";
import { logger } from "../../utils/logger";

const originalError = console.error;

describe("useVFXEffect import error", () => {
  beforeEach(() => {
    console.error = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalError;
    jest.restoreAllMocks();
  });

  it("handles VFX import failure gracefully", async () => {
    // By not mocking the import, Jest will throw MODULE_NOT_FOUND natively
    renderHook(() => useVFXEffect({}));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(console.error).toHaveBeenCalledWith(
      "Failed to load VFX core:",
      expect.objectContaining({
        message: expect.stringContaining("Cannot find module"),
      }),
    );
  });

  it("does not attempt to load VFX if disabled", async () => {
    renderHook(() => useVFXEffect({ enabled: false }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(console.error).not.toHaveBeenCalled();
  });
});
