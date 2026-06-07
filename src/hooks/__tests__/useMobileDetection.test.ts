import { act, renderHook } from "@testing-library/react";
import { useMobileDetection } from "../useMobileDetection";

describe("useMobileDetection", () => {
  // Store original window properties to restore later
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalUserAgent = window.navigator.userAgent;
  const originalMaxTouchPoints = window.navigator.maxTouchPoints;

  // Helper function to mock window size and trigger resize
  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event("resize"));
  };

  const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      configurable: true,
      value: userAgent,
    });
  };

  const setMaxTouchPoints = (points: number) => {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: points,
    });
  };

  beforeEach(() => {
    // Reset window properties before each test
    setWindowSize(1024, 768);
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );
    setMaxTouchPoints(0);
    // Reset msMaxTouchPoints if it was mocked
    Object.defineProperty(window.navigator, "msMaxTouchPoints", {
      writable: true,
      configurable: true,
      value: undefined,
    });
    // Remove ontouchstart if it was added
    if ("ontouchstart" in window) {

      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
  });

  afterAll(() => {
    // Restore original window properties
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      configurable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: originalMaxTouchPoints,
    });
  });

  describe("screen size detection", () => {
    it("detects desktop layout correctly", () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(1200);
      expect(result.current.screenHeight).toBe(800);
    });

    it("detects tablet layout correctly", () => {
      setWindowSize(800, 1024);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(800);
    });

    it("detects mobile layout correctly", () => {
      setWindowSize(375, 667);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.screenWidth).toBe(375);
    });

    it("updates state when window is resized", () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);

      act(() => {
        setWindowSize(375, 667);
      });

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.screenWidth).toBe(375);
    });
  });

  describe("user agent and touch detection", () => {
    it("detects mobile user agent", () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      );
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isMobileUserAgent).toBe(true);
    });

    it("does not detect desktop as mobile user agent", () => {
      setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      );
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isMobileUserAgent).toBe(false);
    });

    it("detects touch device via maxTouchPoints", () => {
      setMaxTouchPoints(5);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isTouchDevice).toBe(true);
    });

    it("detects touch device via ontouchstart", () => {

      (window as unknown as Record<string, unknown>).ontouchstart = null;
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isTouchDevice).toBe(true);
    });

    it("detects mobile device when both user agent and touch match (even on large screen)", () => {
      setWindowSize(1200, 800); // Desktop size
      setUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      );
      setMaxTouchPoints(5);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);
      // isMobileDevice logic returns true if isMobile || (isMobileUserAgent && isTouchDevice)
      expect(result.current.isMobile).toBe(true);
    });
  });

  describe("helper functions", () => {
    beforeEach(() => {
      setWindowSize(800, 600);
    });

    it("isBelowBreakpoint returns correct values", () => {
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBelowBreakpoint(900)).toBe(true);
      expect(result.current.isBelowBreakpoint(700)).toBe(false);
      expect(result.current.isBelowBreakpoint(800)).toBe(false);
    });

    it("isAboveBreakpoint returns correct values", () => {
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isAboveBreakpoint(700)).toBe(true);
      expect(result.current.isAboveBreakpoint(900)).toBe(false);
      expect(result.current.isAboveBreakpoint(800)).toBe(true);
    });

    it("isBetweenBreakpoints returns correct values", () => {
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBetweenBreakpoints(700, 900)).toBe(true);
      expect(result.current.isBetweenBreakpoints(800, 900)).toBe(true); // Inclusive min
      expect(result.current.isBetweenBreakpoints(700, 800)).toBe(false); // Exclusive max
      expect(result.current.isBetweenBreakpoints(900, 1000)).toBe(false);
    });
  });
});
