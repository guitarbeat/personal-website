import { act, renderHook } from "@testing-library/react";
import { useVFXEffect } from "../useVFXEffect";

const mockAdd = jest.fn();
const mockRemove = jest.fn();

// Mock the dynamic import of the VFX library
jest.mock(
  "https://esm.sh/@vfx-js/core",
  () => {
    return {
      VFX: class MockVFX {
        add = mockAdd;
        remove = mockRemove;
      },
    };
  },
  { virtual: true },
);

const originalWarn = console.warn;

describe("useVFXEffect", () => {
  beforeEach(() => {
    console.warn = jest.fn();
    mockAdd.mockClear();
    mockRemove.mockClear();
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  it("initializes VFX instance successfully", async () => {
    renderHook(() => useVFXEffect({}));

    // Wait for dynamic import
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("handles VFX application error gracefully", async () => {
    mockAdd.mockImplementation(() => {
      throw new Error("Simulated add error");
    });

    const activeElement = document.createElement("div");

    // Initial render
    const { rerender } = renderHook((props) => useVFXEffect(props), {
      initialProps: { activeElement: null as HTMLElement | null },
    });

    // Wait for init
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Update activeElement
    rerender({ activeElement });

    expect(console.warn).toHaveBeenCalledWith(
      "VFX application error:",
      expect.any(Error),
    );
  });

  it("handles VFX removal error gracefully", async () => {
    mockRemove.mockImplementation(() => {
      throw new Error("Simulated remove error");
    });

    const element1 = document.createElement("div");
    const element2 = document.createElement("div");

    // Initial render with element1
    const { rerender } = renderHook((props) => useVFXEffect(props), {
      initialProps: { activeElement: element1 as HTMLElement | null },
    });

    // Wait for init and application to element1
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Re-render to ensure previousActiveRef is updated
    rerender({ activeElement: element1 });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Change to element2 to trigger removal on element1
    rerender({ activeElement: element2 });

    expect(console.warn).toHaveBeenCalledWith(
      "VFX removal error:",
      expect.any(Error),
    );
  });

  it("cleans up effects silently on unmount", async () => {
    mockRemove.mockImplementation(() => {
      throw new Error("Simulated cleanup error");
    });

    const activeElement = document.createElement("div");

    const { unmount, rerender } = renderHook((props) => useVFXEffect(props), {
      initialProps: { activeElement: activeElement as HTMLElement | null },
    });

    // Wait for init
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Re-render to ensure element is registered in `previousActiveRef.current`
    rerender({ activeElement });

    // Unmount triggers cleanup
    unmount();

    // The catch block in cleanup has an empty body with a comment // Silently handle cleanup errors
    // So console.warn should not be called
    expect(console.warn).not.toHaveBeenCalledWith(
      "VFX removal error:",
      expect.any(Error),
    );
  });
});
