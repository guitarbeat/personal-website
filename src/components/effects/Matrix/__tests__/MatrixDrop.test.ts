import { Drop } from "../MatrixDrop";
import { MATRIX_RAIN } from "../constants";

describe("Drop", () => {
  beforeEach(() => {
    // Mock secureRandom implicitly by setting Math.random or spying on crypto if needed.
    // The implementation falls back to Math.random if window.crypto is unavailable.
    // In node/jsdom test env, window.crypto might not be fully implemented.
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    // Mock crypto to ensure tests are deterministic
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "crypto", {
        value: {
          getRandomValues: (arr: Uint32Array) => {
            arr[0] = 4294967296 * 0.5; // 0.5
            return arr;
          },
        },
        configurable: true,
      });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("initializes with correct properties", () => {
    const drop = new Drop(10);
    expect(drop.x).toBe(10);
    expect(drop.y).toBe(-100);
    expect(MATRIX_RAIN.ALPHABET).toContain(drop.char);
    expect(drop.frame).toBe(0);
    expect(drop.trail).toEqual([]);
    expect(drop.brightHeadThreshold).toBe(0.97);
  });

  it("updates position based on speed and canvasHeight", () => {
    const drop = new Drop(10);
    drop.speed = 1;
    drop.y = 0;

    drop.update(100);

    expect(drop.y).toBe(1);
    expect(drop.frame).toBe(1);
    expect(drop.trail.length).toBe(1);
    expect(drop.trail[0].y).toBe(1);
  });

  it("resets when exceeding canvas height", () => {
    const drop = new Drop(10);
    drop.y = 100;
    const initialFontSize = 20;
    drop.fontSize = initialFontSize;
    drop.speed = 1;
    drop.trail = [{ char: "A", y: 99 }];

    drop.update(100); // 101 * 20 = 2020 > 100

    expect(drop.y).toBe(-100 / initialFontSize);
    expect(drop.trail).toEqual([]);
  });

  it("updates character when frame exceeds changeInterval", () => {
    const drop = new Drop(10);
    drop.changeInterval = 10;
    drop.frame = 10;

    drop.update(100);

    expect(drop.frame).toBe(0);
  });

  it("allows setting brightHeadThreshold", () => {
    const drop = new Drop(10);
    drop.setBrightHeadThreshold(0.8);
    expect(drop.brightHeadThreshold).toBe(0.8);
  });
});
