import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Matrix from "../Matrix";
import { UnlockProvider } from "../UnlockContext";

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
      mockGetContext as unknown as HTMLCanvasElement["getContext"];

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

  it("should debounce resize events (optimization verification)", () => {
    render(
      <UnlockProvider>
        <Matrix isVisible={true} />
      </UnlockProvider>,
    );

    // Initial render calls resizeCanvas once directly
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);

    // Clear initial calls to focus on event listener behavior
    widthSetterSpy.mockClear();

    // Trigger rapid resize events
    const resizeEvent = new Event("resize");

    act(() => {
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(resizeEvent);
      }
      // Advance timers by debounce duration (200ms) inside act to avoid warnings
      jest.advanceTimersByTime(200);
    });

    // We do not check for 0 calls right before advancing time because advancing time triggers state updates
    // that should be wrapped in act, and separating them causes warnings.

    // Now it should have been called EXACTLY once
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);
  });
});
