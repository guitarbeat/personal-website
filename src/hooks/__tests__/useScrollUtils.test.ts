import { renderHook, act } from '@testing-library/react';
import { useScrollPosition, useScrollThreshold } from '../useScrollUtils';

describe('useScrollUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset window scroll position
    window.scrollY = 0;
    // Mock addEventListener and removeEventListener to verify cleanup
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('useScrollPosition', () => {
    it('should initialize with the current window.scrollY', () => {
      window.scrollY = 100;
      const { result } = renderHook(() => useScrollPosition());
      expect(result.current).toBe(100);
    });

    it('should update scroll position on scroll event with throttling', () => {
      const { result } = renderHook(() => useScrollPosition(100));

      expect(result.current).toBe(0);

      // Simulate scroll
      window.scrollY = 200;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Still 0 before throttle timeout
      expect(result.current).toBe(0);

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Now updated
      expect(result.current).toBe(200);
    });

    it('should clean up scroll event listener on unmount', () => {
      const { unmount } = renderHook(() => useScrollPosition());

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  describe('useScrollThreshold', () => {
    it('should initialize correctly based on window.scrollY', () => {
      window.scrollY = 400;
      const { result } = renderHook(() => useScrollThreshold(300));
      expect(result.current).toBe(true);

      window.scrollY = 200;
      const { result: result2 } = renderHook(() => useScrollThreshold(300));
      expect(result2.current).toBe(false);
    });

    it('should update when crossing threshold with throttling', () => {
      window.scrollY = 0;
      const { result } = renderHook(() => useScrollThreshold(300, 100));

      expect(result.current).toBe(false);

      // Scroll below threshold
      window.scrollY = 200;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(false);

      // Scroll above threshold
      window.scrollY = 400;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(true);
    });

    it('should clean up scroll event listener on unmount', () => {
      const { unmount } = renderHook(() => useScrollThreshold());

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });
});
