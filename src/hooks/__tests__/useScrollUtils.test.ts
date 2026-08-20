import { act, renderHook } from "@testing-library/react";
import {
  useScrollPosition,
  useScrollThreshold,
  useThrottledScroll,
} from "../useScrollUtils";

describe("useScrollUtils", () => {
  beforeEach(() => {
    // Reset window.scrollY before each test
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("useThrottledScroll", () => {
    it("should use default throttleMs when not provided", () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useThrottledScroll(callback));

      let handler: () => void = () => {};
      act(() => {
        handler = result.current();
      });

      act(() => {
        handler();
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(16);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("useScrollPosition", () => {
    it("should return initial scroll position of 0", () => {
      const { result } = renderHook(() => useScrollPosition());
      expect(result.current).toBe(0);
    });

    it("should update scroll position when window scrolls", () => {
      const { result } = renderHook(() => useScrollPosition(16));

      // Simulate scroll
      act(() => {
        window.scrollY = 100;
        window.dispatchEvent(new Event("scroll"));
      });

      // Initially it should still be 0 because it's throttled
      expect(result.current).toBe(0);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(16);
      });

      expect(result.current).toBe(100);
    });

    it("should use default throttleMs when not provided", () => {
      const { result } = renderHook(() => useScrollPosition(undefined));

      act(() => {
        window.scrollY = 100;
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(0);

      act(() => {
        jest.advanceTimersByTime(16);
      });

      expect(result.current).toBe(100);
    });

    it("should throttle scroll events", () => {
      const { result } = renderHook(() => useScrollPosition(100));

      // 1st scroll
      act(() => {
        window.scrollY = 50;
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(0);

      // 2nd scroll immediately after
      act(() => {
        window.scrollY = 150;
        window.dispatchEvent(new Event("scroll"));
      });

      // advance halfway
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(result.current).toBe(0);

      // advance fully
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(result.current).toBe(150);
    });

    it("should clean up event listener on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useScrollPosition());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("useScrollThreshold", () => {
    it("should use default arguments when not provided", () => {
      const { result } = renderHook(() => useScrollThreshold());
      expect(result.current).toBe(false);

      act(() => {
        window.scrollY = 301;
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(false);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(true);
    });

    it("should return false initially if scroll is below threshold", () => {
      const { result } = renderHook(() => useScrollThreshold(300, 100));
      expect(result.current).toBe(false);
    });

    it("should return true initially if scroll is above threshold", () => {
      window.scrollY = 400;
      const { result } = renderHook(() => useScrollThreshold(300, 100));
      expect(result.current).toBe(true);
    });

    it("should update when scroll crosses threshold", () => {
      const { result } = renderHook(() => useScrollThreshold(300, 100));

      expect(result.current).toBe(false);

      // Scroll just below threshold
      act(() => {
        window.scrollY = 300;
        window.dispatchEvent(new Event("scroll"));
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(false);

      // Scroll above threshold
      act(() => {
        window.scrollY = 301;
        window.dispatchEvent(new Event("scroll"));
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(true);

      // Scroll back below threshold
      act(() => {
        window.scrollY = 299;
        window.dispatchEvent(new Event("scroll"));
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(false);
    });

    it("should throttle scroll checks", () => {
      const { result } = renderHook(() => useScrollThreshold(300, 100));

      act(() => {
        window.scrollY = 400;
        window.dispatchEvent(new Event("scroll"));
      });

      // Before throttle elapsed
      expect(result.current).toBe(false);

      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current).toBe(false);

      act(() => {
        jest.advanceTimersByTime(50);
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

      removeEventListenerSpy.mockRestore();
    });
  });
});
