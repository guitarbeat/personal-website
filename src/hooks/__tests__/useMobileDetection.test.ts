import { renderHook, act } from '@testing-library/react';
import { useMobileDetection } from '../useMobileDetection';

describe('useMobileDetection', () => {
  // Store original values to restore them later
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalUserAgent = window.navigator.userAgent;
  const originalMaxTouchPoints = window.navigator.maxTouchPoints;

  // Helper function to resize the window
  const resizeWindow = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  // Helper function to mock userAgent
  const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: userAgent,
      writable: true,
      configurable: true,
    });
  };

  // Helper function to mock maxTouchPoints
  const setMaxTouchPoints = (points: number) => {
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: points,
      writable: true,
      configurable: true,
    });
  };

  beforeEach(() => {
    // Reset to default values before each test
    resizeWindow(1024, 768);
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    setMaxTouchPoints(0);
    // Remove ontouchstart if it was added
    if ('ontouchstart' in window) {
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
  });

  afterAll(() => {
    // Restore original values after all tests
    resizeWindow(originalInnerWidth, originalInnerHeight);
    setUserAgent(originalUserAgent);
    setMaxTouchPoints(originalMaxTouchPoints);
  });

  it('detects desktop size correctly', () => {
    resizeWindow(1200, 800);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.screenWidth).toBe(1200);
    expect(result.current.screenHeight).toBe(800);
  });

  it('detects tablet size correctly', () => {
    resizeWindow(800, 600);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.screenWidth).toBe(800);
    expect(result.current.screenHeight).toBe(600);
  });

  it('detects mobile size correctly', () => {
    resizeWindow(400, 800);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.screenWidth).toBe(400);
    expect(result.current.screenHeight).toBe(800);
  });

  it('updates values on window resize', () => {
    resizeWindow(1200, 800);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);

    act(() => {
      resizeWindow(400, 800);
    });

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.screenWidth).toBe(400);
  });

  it('detects mobile user agent correctly', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1');
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobileUserAgent).toBe(true);
  });

  it('detects non-mobile user agent correctly', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobileUserAgent).toBe(false);
  });

  it('detects touch device via ontouchstart', () => {
    (window as unknown as Record<string, unknown>).ontouchstart = null;
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('detects touch device via maxTouchPoints', () => {
    setMaxTouchPoints(5);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('isMobile is true if screen size is small even on non-touch device', () => {
    resizeWindow(400, 800);
    setMaxTouchPoints(0);
    setUserAgent('Windows');

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
  });

  it('isMobile is true if device has mobile UA and touch even on large screen', () => {
    resizeWindow(1200, 800); // Large screen
    setMaxTouchPoints(5); // Touch enabled
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'); // Mobile UA

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
  });

  describe('helper functions', () => {
    it('isBelowBreakpoint works correctly', () => {
      resizeWindow(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBelowBreakpoint(1000)).toBe(true);
      expect(result.current.isBelowBreakpoint(800)).toBe(false);
      expect(result.current.isBelowBreakpoint(600)).toBe(false);
    });

    it('isAboveBreakpoint works correctly', () => {
      resizeWindow(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isAboveBreakpoint(600)).toBe(true);
      expect(result.current.isAboveBreakpoint(800)).toBe(true);
      expect(result.current.isAboveBreakpoint(1000)).toBe(false);
    });

    it('isBetweenBreakpoints works correctly', () => {
      resizeWindow(800, 600);
      const { result } = renderHook(() => useMobileDetection());

      expect(result.current.isBetweenBreakpoints(600, 1000)).toBe(true);
      expect(result.current.isBetweenBreakpoints(800, 1000)).toBe(true);
      expect(result.current.isBetweenBreakpoints(500, 700)).toBe(false);
      expect(result.current.isBetweenBreakpoints(900, 1000)).toBe(false);
    });
  });
});
