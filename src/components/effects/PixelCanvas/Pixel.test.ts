import { Pixel } from "./Pixel";

describe("Pixel", () => {
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = {
      fillRect: jest.fn(),
      globalAlpha: 1,
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
  });

  it("should initialize with correct values", () => {
    const pixel = new Pixel(mockCtx, 800, 600, 100, 200, "#fff", 10, 0);
    expect(pixel.x).toBe(100);
    expect(pixel.y).toBe(200);
    expect(pixel.width).toBe(800);
    expect(pixel.height).toBe(600);
    expect(pixel.color).toBe("#fff");
  });

  it("should draw itself", () => {
    const pixel = new Pixel(mockCtx, 800, 600, 100, 200, "#fff", 10, 0);
    pixel.size = 10;
    pixel.draw();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillStyle).toBe("#fff");
  });

  it("should handle appear animation", () => {
    // Use negative delay to ensure immediate draw call
    const pixel = new Pixel(mockCtx, 800, 600, 100, 200, "#fff", 10, -1);
    pixel.appear();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(pixel.isIdle).toBe(false);
  });
});
