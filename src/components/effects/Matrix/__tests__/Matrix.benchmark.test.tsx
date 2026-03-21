import { act, render } from "@testing-library/react";
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
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should debounce resize events (optimization verification)", () => {
    render(
      <AuthProvider>
        <Matrix isVisible={true} />
      </AuthProvider>,
    );

    // Initial render calls resizeCanvas once directly
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);

    // Clear initial calls to focus on event listener behavior
    widthSetterSpy.mockClear();

    // Trigger rapid resize events
    // Wrap state updates triggered by resize in act()
    act(() => {
      const resizeEvent = new Event("resize");
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(resizeEvent);
      }
    });

    // Immediately after events, it should NOT have been called due to debounce
    expect(widthSetterSpy).toHaveBeenCalledTimes(0);

    // Advance timers by debounce duration (200ms)
    // This triggers the debounced callback which might update state or DOM
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Now it should have been called EXACTLY once
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);
  });
});
