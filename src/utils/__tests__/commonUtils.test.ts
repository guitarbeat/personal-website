import { isAboveBreakpoint, randomFloat } from "../commonUtils";

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

  describe("randomFloat", () => {
    it("returns a number within the range", () => {
      const min = 1.5;
      const max = 4.5;
      const result = randomFloat(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThan(max);
    });

    it("returns min when min equals max", () => {
      expect(randomFloat(3.14, 3.14)).toBe(3.14);
    });
  });
});
