import { act, renderHook } from "@testing-library/react";
import useMobileDetection from "../useMobileDetection";

describe("useMobileDetection", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalUserAgent = window.navigator.userAgent;
  const originalMaxTouchPoints = window.navigator.maxTouchPoints;

  beforeEach(() => {
    // Reset window properties before each test
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
      value: 0,
    });
  });

  afterAll(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
    });
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: originalMaxTouchPoints,
    });
  });

  it("should initialize with desktop values by default (assuming > 1017px)", () => {
    // Set width to typical desktop
    window.innerWidth = 1200;

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });

  it("should detect mobile screen width (< 768px)", () => {
    window.innerWidth = 500;

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should detect tablet screen width (768px - 1016px)", () => {
    window.innerWidth = 800;

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should detect desktop screen width (> 1016px)", () => {
    window.innerWidth = 1100;

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(false);
  });

  it("should update on resize", () => {
    window.innerWidth = 1200;
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should return true for isMobileUserAgent with mobile UA", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobileUserAgent).toBe(true);
  });

  it("should return true for isTouchDevice with maxTouchPoints > 0", () => {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: 1,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it("should return true for isMobile if isMobileUserAgent AND isTouchDevice are true, even on large screen", () => {
    window.innerWidth = 1200; // Desktop width

    Object.defineProperty(window.navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: 1,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(true); // Still desktop by width
  });

  it("should handle helper functions correctly", () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isBelowBreakpoint(1000)).toBe(true);
    expect(result.current.isBelowBreakpoint(500)).toBe(false);

    expect(result.current.isAboveBreakpoint(500)).toBe(true);
    expect(result.current.isAboveBreakpoint(1000)).toBe(false);

    expect(result.current.isBetweenBreakpoints(700, 900)).toBe(true);
    expect(result.current.isBetweenBreakpoints(900, 1000)).toBe(false);
  });
});
