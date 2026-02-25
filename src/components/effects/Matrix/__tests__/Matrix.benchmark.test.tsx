import { render } from "@testing-library/react";
import Matrix from "../Matrix";

// Mock canvas and context
const mockGetContext = jest.fn();
const mockFillRect = jest.fn();
const mockFillText = jest.fn();
const mockClearRect = jest.fn();

describe("Matrix Component Benchmark", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    mockGetContext.mockReturnValue({
      fillRect: mockFillRect,
      fillText: mockFillText,
      clearRect: mockClearRect,
      canvas: {
        width: 1920,
        height: 1080,
      },
      font: "",
      fillStyle: "",
      globalAlpha: 1,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Mocking canvas context needs loose typing
    HTMLCanvasElement.prototype.getContext = mockGetContext as any;

    // Spy on canvas width setter
    Object.defineProperty(HTMLCanvasElement.prototype, "width", {
      writable: true,
      value: 1920,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "height", {
      writable: true,
      value: 1080,
    });
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock requestAnimationFrame to execute immediately in some tests if needed
    // or just spy on it
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return setTimeout(cb, 0);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    render(<Matrix isVisible={true} />);
    expect(mockGetContext).toHaveBeenCalled();
  });
});
