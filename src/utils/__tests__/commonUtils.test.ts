import {
  clamp,
  cn,
  isAboveBreakpoint,
  randomFloat,
  randomInt,
} from "../commonUtils";

describe("commonUtils", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns min when value is less than min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("returns max when value is greater than max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("randomInt", () => {
    it("returns integer within range", () => {
      const result = randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("randomFloat", () => {
    it("returns float within range", () => {
      const result = randomFloat(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThan(10);
    });
  });

  describe("cn", () => {
    it("joins class names", () => {
      expect(cn("base", "foo", "bar")).toBe("base foo bar");
    });

    it("filters falsy values", () => {
      expect(cn("base", false && "foo", null, undefined, "bar")).toBe(
        "base bar",
      );
    });
  });

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
