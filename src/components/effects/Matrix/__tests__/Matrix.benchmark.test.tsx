import { render, act } from "@testing-library/react";
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
      <AuthProvider>
        <Matrix isVisible={true} />
      </AuthProvider>,
    );

    // Initial render calls resizeCanvas once directly
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);

    // Clear initial calls to focus on event listener behavior
    widthSetterSpy.mockClear();

    // Trigger rapid resize events
    const resizeEvent = new Event("resize");
    for (let i = 0; i < 10; i++) {
      window.dispatchEvent(resizeEvent);
    }

    // Immediately after events, it should NOT have been called due to debounce
    expect(widthSetterSpy).toHaveBeenCalledTimes(0);

    // Advance timers by debounce duration (200ms)
    jest.advanceTimersByTime(200);

    // Now it should have been called EXACTLY once
    expect(widthSetterSpy).toHaveBeenCalledTimes(1);
  });

  it('measures drawFrame performance', () => {
    // Setup canvas mock specifically for drawFrame measurement
    const fillTextMock = jest.fn();
    const fillRectMock = jest.fn();

    // We want to count how many object allocations or loop iterations happen
    const mockContext = {
      fillRect: fillRectMock,
      fillText: fillTextMock,
      font: '',
      fillStyle: '',
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0
    };

    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as unknown as jest.Mock;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
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

    // Create a large canvas to generate many drops
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

    const { unmount } = render(
      <AuthProvider><Matrix isVisible={true} onSuccess={jest.fn()} /></AuthProvider>
    );

    // Fast-forward to trigger some frames
    const _startTime = performance.now();
    act(() => {
      jest.advanceTimersByTime(1000); // 1 second of animation (~60 frames)
    });
    const _endTime = performance.now();

    // console.log(`Animated 60 frames in ${endTime - startTime}ms simulation time.`);
    // console.log(`fillText calls: ${fillTextMock.mock.calls.length}`);

    unmount();
  });
});
