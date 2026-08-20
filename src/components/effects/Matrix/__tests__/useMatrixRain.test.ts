import { renderHook, act } from "@testing-library/react";
import { useMatrixRain } from "../useMatrixRain";
import type { RefObject } from "react";

describe("useMatrixRain", () => {
  let canvasRef: RefObject<HTMLCanvasElement | null>;
  let intensityRef: RefObject<number>;
  let mockContext: any;
  let mockCanvas: any;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock prefers-reduced-motion correctly
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    mockContext = {
      fillRect: jest.fn(),
      fillText: jest.fn(),
      fillStyle: "",
      font: "",
      globalAlpha: 1,
      shadowColor: "",
      shadowBlur: 0,
    };

    mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      width: 0,
      height: 0,
    };

    canvasRef = { current: mockCanvas };
    intensityRef = { current: 0.5 };

    // Since we're using jest.useFakeTimers(), requestAnimationFrame gets mocked by jest
    // but the clear method uses standard clearTimeout under the hood in testing environments
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      clearTimeout(id);
    });
    jest.spyOn(performance, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does nothing when isVisible is false", () => {
    renderHook(() => useMatrixRain(canvasRef, false, intensityRef));
    expect(mockCanvas.getContext).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("initializes animation and resizes canvas when isVisible is true", () => {
    window.innerWidth = 800;
    window.innerHeight = 600;

    const { unmount } = renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    unmount();
  });

  it("cleans up event listeners and animation frame on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("draws frames correctly on animation ticks", () => {
    renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    // Initial call
    expect(mockContext.fillRect).toHaveBeenCalled();

    // Clear initial calls
    mockContext.fillRect.mockClear();

    // Update performance.now to trigger next frame
    jest.spyOn(performance, "now").mockReturnValue(1000 + 1000/60 + 1); // targetFPS is 60

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(17);
    });

    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it("debounces resize events", () => {
    renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    window.innerWidth = 1000;

    // Trigger rapid resize events
    const resizeEvent = new Event("resize");

    act(() => {
      for (let i = 0; i < 5; i++) {
        window.dispatchEvent(resizeEvent);
      }
    });

    // Advance timers by debounce duration (200ms)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should have updated canvas width due to resize
    expect(mockCanvas.width).toBe(1000);
  });

  it("handles prefers-reduced-motion correctly", () => {
    // Mock reduced motion to true
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    // Update performance.now to trigger next frame
    jest.spyOn(performance, "now").mockReturnValue(1000 + 1000/60 + 1);

    act(() => {
      jest.advanceTimersByTime(17);
    });

    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it("exits early if canvas context is not available", () => {
    mockCanvas.getContext = jest.fn().mockReturnValue(null);
    renderHook(() => useMatrixRain(canvasRef, true, intensityRef));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    // No context means no drawing functions can be called
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  it("exits early if canvasRef.current is null", () => {
    const nullCanvasRef = { current: null };
    renderHook(() => useMatrixRain(nullCanvasRef, true, intensityRef));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(mockCanvas.getContext).not.toHaveBeenCalled();
  });

  it("handles undefined matchMedia gracefully", () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error - testing undefined case
    delete window.matchMedia;

    renderHook(() => useMatrixRain(canvasRef, true, intensityRef));

    // Update performance.now to trigger next frame
    jest.spyOn(performance, "now").mockReturnValue(1000 + 1000/60 + 1);

    act(() => {
      jest.advanceTimersByTime(17);
    });

    expect(mockContext.fillRect).toHaveBeenCalled();

    // Restore
    window.matchMedia = originalMatchMedia;
  });
});
