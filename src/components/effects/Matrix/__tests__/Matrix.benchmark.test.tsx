import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider } from "../AuthContext";
import Matrix from "../Matrix";

describe("Matrix Performance", () => {
  let widthSetterSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock canvas context
    const mockGetContext = jest.fn().mockReturnValue({
      canvas: { width: 0, height: 0 },
      fillStyle: "",
      font: "",
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 10 }),
      // Add necessary props for passes
      shadowBlur: 0,
      shadowColor: "",
      globalAlpha: 1,
    });
    HTMLCanvasElement.prototype.getContext =
      mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext;

    // Spy on canvas width setter
    widthSetterSpy = jest.spyOn(HTMLCanvasElement.prototype, "width", "set");

    // Mock audio
    window.HTMLMediaElement.prototype.play = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should debounce resize events (optimization verification)", async () => {
    // Suppress specific React act() warnings for background hook updates during this test
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("An update to") &&
        args[0].includes("inside a test was not wrapped in act")
      ) {
        return;
      }
      originalError(...args);
    };

    try {
      render(
        <AuthProvider>
          <Matrix isVisible={true} />
        </AuthProvider>,
      );

      // Initial render calls resizeCanvas once directly
      expect(widthSetterSpy).toHaveBeenCalledTimes(1);

      // Clear initial calls to focus on event listener behavior
      widthSetterSpy.mockClear();

      const React = await import("react");
      React.act(() => {
        // Trigger rapid resize events
        const resizeEvent = new Event("resize");
        for (let i = 0; i < 10; i++) {
          window.dispatchEvent(resizeEvent);
        }
      });

      // Immediately after events, it should NOT have been called due to debounce
      expect(widthSetterSpy).toHaveBeenCalledTimes(0);

      React.act(() => {
        // Advance timers by debounce duration (200ms)
        jest.advanceTimersByTime(200);
      });

      // Now it should have been called EXACTLY once
      expect(widthSetterSpy).toHaveBeenCalledTimes(1);
    } finally {
      console.error = originalError;
    }
  });
});
