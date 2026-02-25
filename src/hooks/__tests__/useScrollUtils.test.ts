import { act, renderHook } from "@testing-library/react";
import { useScrollThreshold } from "../useScrollUtils";

describe("useScrollThreshold", () => {
  const originalScrollY = window.scrollY;

  beforeAll(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });
  });

  beforeEach(() => {
    window.scrollY = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should return false initially (scroll < threshold)", () => {
    const { result } = renderHook(() => useScrollThreshold(300));
    expect(result.current).toBe(false);
  });

  it("should update to true when scrolled past threshold", () => {
    const { result } = renderHook(() => useScrollThreshold(100));

    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
      jest.advanceTimersByTime(100); // Default throttle is 100ms
    });

    expect(result.current).toBe(true);
  });

  it("should update to false when scrolled back below threshold", () => {
    const { result } = renderHook(() => useScrollThreshold(100));

    // First scroll down
    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    // Then scroll up
    act(() => {
      window.scrollY = 50;
      window.dispatchEvent(new Event("scroll"));
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });

  it("should respect custom throttle time", () => {
    const throttleMs = 500;
    const { result } = renderHook(() => useScrollThreshold(100, throttleMs));

    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
    });

    // Should not update immediately due to throttle
    // Note: The implementation uses setTimeout which puts the callback in the macro task queue.
    // Even if throttleMs was 0, it would still be async.
    // However, since we used fake timers, we can control exact timing.
    // The previous state was false. It remains false until the timeout fires.
    expect(result.current).toBe(false);

    // Should update after throttle time
    act(() => {
      jest.advanceTimersByTime(throttleMs);
    });
    expect(result.current).toBe(true);
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollThreshold());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  it("should initialize correctly if already scrolled past threshold", () => {
    window.scrollY = 200;
    const { result } = renderHook(() => useScrollThreshold(100));

    // The initial check happens in useEffect which runs after render.
    // renderHook waits for effects? Usually yes.
    expect(result.current).toBe(true);
  });
});
