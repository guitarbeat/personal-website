import { randomFloat, randomInt } from "../commonUtils";

describe("commonUtils", () => {
  describe("randomInt", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns a number between min and max inclusive", () => {
      const min = 1;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const result = randomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("returns min when random returns 0", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      expect(randomInt(1, 10)).toBe(1);
    });

    it("returns max when random returns almost 1", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.999999999);
      expect(randomInt(1, 10)).toBe(10);
    });

    it("returns min when min equals max", () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe("randomFloat", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns a number between min and max", () => {
      const min = 1.5;
      const max = 4.5;
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThan(max);
      }
    });

    it("returns min when random returns 0", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      expect(randomFloat(1.5, 4.5)).toBe(1.5);
    });

    it("returns close to max when random returns almost 1", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.999999999);
      expect(randomFloat(1.5, 4.5)).toBeCloseTo(4.5);
    });

    it("returns min when min equals max", () => {
      expect(randomFloat(3.14, 3.14)).toBe(3.14);
import { isAboveBreakpoint } from "../commonUtils";

describe("commonUtils", () => {
  describe("isAboveBreakpoint", () => {
    const originalInnerWidth = window.innerWidth;

    beforeAll(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    afterAll(() => {
      window.innerWidth = originalInnerWidth;
    });

    it("returns true when window width is greater than breakpoint", () => {
      window.innerWidth = 1024;
      expect(isAboveBreakpoint(768)).toBe(true);
    });

    it("returns false when window width is equal to breakpoint", () => {
      window.innerWidth = 768;
      expect(isAboveBreakpoint(768)).toBe(false);
    });

    it("returns false when window width is less than breakpoint", () => {
      window.innerWidth = 500;
      expect(isAboveBreakpoint(768)).toBe(false);
    });
  });
});
