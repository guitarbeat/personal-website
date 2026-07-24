import { act, renderHook } from "@testing-library/react";
import { useScrollThreshold } from "../useScrollUtils";

describe("useScrollUtils", () => {
  beforeAll(() => {
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", {
      get: () => scrollY,
      set: (val) => {
        scrollY = val;
      },
      configurable: true,
    });
  });

  beforeEach(() => {
    window.scrollY = 0; // RESET for each test!
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("useScrollThreshold", () => {
    it("should return false initially when scrollY is below threshold", () => {
      window.scrollY = 0;
      const { result } = renderHook(() => useScrollThreshold(300, 100));
      expect(result.current).toBe(false);
    });

    it("should return true initially when scrollY is above threshold", () => {
      window.scrollY = 400;
      const { result } = renderHook(() => useScrollThreshold(300, 100));
      expect(result.current).toBe(true);
    });

    it("should update value on scroll after throttle time", () => {
      const { result } = renderHook(() => useScrollThreshold(300, 100));
      expect(result.current).toBe(false);

      act(() => {
        window.scrollY = 400;
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(false);

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current).toBe(true);
    });

    it("should remove event listener on unmount", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useScrollThreshold(300, 100));
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        { passive: true },
      );

      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
      );
    });
  });
});
