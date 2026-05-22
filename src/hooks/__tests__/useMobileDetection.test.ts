import { renderHook, act } from "@testing-library/react";
import { useMobileDetection } from "../useMobileDetection";

describe("useMobileDetection", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalUserAgent = window.navigator.userAgent;
  const originalMaxTouchPoints = window.navigator.maxTouchPoints;

  const setWindowDimensions = (width: number, height: number) => {
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
  };

  const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      configurable: true,
      value: userAgent,
    });
  };

  const setTouchPoints = (points: number) => {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: points,
    });
    if (points > 0) {
      Object.defineProperty(window, "ontouchstart", {
        writable: true,
        configurable: true,
        value: null,
      });
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: Mocking window property safely
      delete (window as any).ontouchstart;
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    setWindowDimensions(originalInnerWidth, originalInnerHeight);
    setUserAgent(originalUserAgent);
    setTouchPoints(originalMaxTouchPoints);
  });

  describe("Screen size detection", () => {
    it("should detect desktop dimensions (>= 1017px)", () => {
      setWindowDimensions(1200, 800);
      setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
      setTouchPoints(0);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(1200);
      expect(result.current.screenHeight).toBe(800);
    });

    it("should detect tablet dimensions (>= 768px and < 1017px)", () => {
      setWindowDimensions(800, 1024);
      setUserAgent("Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X)");
      setTouchPoints(0);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(800);
      expect(result.current.screenHeight).toBe(1024);
    });

    it("should detect mobile dimensions (< 768px)", () => {
      setWindowDimensions(375, 667);
      setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)");
      setTouchPoints(0);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(true); // isMobileDevice uses isMobile
      expect(result.current.screenWidth).toBe(375);
      expect(result.current.screenHeight).toBe(667);
    });
  });

  describe("Fallback detection for mobile via User Agent and Touch", () => {
    it("should classify as mobile device if dimensions are large but user agent and touch match", () => {
      // Dimensions imply desktop
      setWindowDimensions(1024, 1366);
      // User agent implies iPad (which regex might catch)
      setUserAgent("Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X)");
      setTouchPoints(5);

      const { result } = renderHook(() => useMobileDetection());

      // isDesktop will be true based on width
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);

      // However, it should be classified as mobile device due to fallback
      expect(result.current.isMobile).toBe(true); // this corresponds to `isMobileDevice`
      expect(result.current.isMobileUserAgent).toBe(true);
      expect(result.current.isTouchDevice).toBe(true);
    });

    it("should not classify as mobile device if large screen, mobile user agent, but NO touch", () => {
      setWindowDimensions(1024, 1366);
      setUserAgent("Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X)");
      setTouchPoints(0);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false); // No touch = not mobile device
      expect(result.current.isMobileUserAgent).toBe(true);
      expect(result.current.isTouchDevice).toBe(false);
    });
  });

  describe("Helper functions", () => {
    it("isBelowBreakpoint should work correctly", () => {
      setWindowDimensions(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBelowBreakpoint(900)).toBe(true);
      expect(result.current.isBelowBreakpoint(700)).toBe(false);
    });

    it("isAboveBreakpoint should work correctly", () => {
      setWindowDimensions(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isAboveBreakpoint(700)).toBe(true);
      expect(result.current.isAboveBreakpoint(900)).toBe(false);
    });

    it("isBetweenBreakpoints should work correctly", () => {
      setWindowDimensions(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBetweenBreakpoints(700, 900)).toBe(true);
      expect(result.current.isBetweenBreakpoints(800, 900)).toBe(true); // Inclusive min
      expect(result.current.isBetweenBreakpoints(700, 800)).toBe(false); // Exclusive max
    });
  });

  describe("Window resize events", () => {
    it("should update detection on resize", () => {
      setWindowDimensions(1200, 800);
      setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
      setTouchPoints(0);

      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.screenWidth).toBe(1200);

      // Simulate resize to mobile dimensions
      act(() => {
        setWindowDimensions(400, 800);
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.screenWidth).toBe(400);
    });
  });
});
