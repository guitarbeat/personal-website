import { renderHook, act } from "@testing-library/react";
import { useVFXEffect } from "../useVFXEffect";

const originalWarn = console.warn;

describe("useVFXEffect import error", () => {
  beforeEach(() => {
    console.warn = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.warn = originalWarn;
    jest.restoreAllMocks();
  });

  it("handles VFX import failure gracefully", async () => {
    // By not mocking the import, Jest will throw MODULE_NOT_FOUND natively
    renderHook(() => useVFXEffect({}));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(console.warn).toHaveBeenCalledWith(
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

    expect(console.warn).not.toHaveBeenCalled();
  });
});
