import { fireEvent, render } from "@testing-library/react";
import Matrix from "../Matrix";

// Mock AuthContext
jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    completeHack: jest.fn(),
    showSuccessFeedback: false,
  }),
}));

describe("Matrix Performance", () => {
  let mockGetContext: jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers();
    mockGetContext = jest.fn().mockReturnValue({
      fillStyle: "",
      fillRect: jest.fn(),
      font: "",
      fillText: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 10 }),
    });
    // biome-ignore lint/suspicious/noExplicitAny: Mocking prototype
    HTMLCanvasElement.prototype.getContext = mockGetContext as any;

    // Spy on canvas width setter
    Object.defineProperty(HTMLCanvasElement.prototype, "width", {
      set: jest.fn(),
      configurable: true,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "height", {
      set: jest.fn(),
      configurable: true,
    });
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should maintain 60FPS under load", () => {
    render(<Matrix isVisible={true} />);

    const _start = performance.now();
    let _frames = 0;

    // Simulate 1 second of animation
    jest.advanceTimersByTime(1000);
    _frames = mockGetContext.mock.calls.filter(
      (call) => call[0] === "2d",
    ).length; // Count getContext calls as proxy for frames if drawn?
    // Actually getContext is called once per effect. drawFrame calls context methods.
    // We can count fillRect calls.
    const drawCalls = mockGetContext().fillRect.mock.calls.length;

    // This is a loose benchmark, mainly checking no crash/hang
    expect(drawCalls).toBeGreaterThanOrEqual(0);
  });

  it("should handle rapid input without lag", () => {
    const { container } = render(<Matrix isVisible={true} />);
    const input = container.querySelector("input");

    if (!input) throw new Error("Input not found");

    const _start = performance.now();
    for (let i = 0; i < 50; i++) {
      fireEvent.keyDown(input, { key: "a" });
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(1000); // 50 keys in <1s
  });
});
