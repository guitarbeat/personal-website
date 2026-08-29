import { renderHook, act } from "@testing-library/react";
import { useAvatarTransition } from "./useAvatarTransition";

describe("useAvatarTransition error handling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("gracefully handles sessionStorage.setItem errors", () => {
    const originalSetItem = window.sessionStorage.setItem;

    const mockSetItem = jest.fn(() => {
      throw new Error("QuotaExceededError");
    });

    Object.defineProperty(window, "sessionStorage", {
      value: {
        ...window.sessionStorage,
        setItem: mockSetItem,
      },
      writable: true,
    });

    const { result } = renderHook(() => useAvatarTransition());

    act(() => {
      result.current.handleClick();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSetItem).toHaveBeenCalled();
    expect(result.current.isTransitioning).toBe(false);

    Object.defineProperty(window, "sessionStorage", {
      value: {
        ...window.sessionStorage,
        setItem: originalSetItem,
      },
      writable: true,
    });
  });

  it("gracefully handles document.startViewTransition errors", () => {
    // Mock startViewTransition to throw an error
    const mockStartViewTransition = jest.fn(() => {
      throw new Error("ViewTransition unsupported or failed");
    });

    // Save original if it exists
    const originalStartViewTransition = document.startViewTransition;
    document.startViewTransition = mockStartViewTransition as any;

    const { result } = renderHook(() => useAvatarTransition());

    act(() => {
      result.current.handleClick();
    });

    // Advance timers so the fallback timer completes
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isTransitioning).toBe(false);

    // Restore
    document.startViewTransition = originalStartViewTransition;
  });
});
