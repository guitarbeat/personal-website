import { clamp } from "../commonUtils";

describe("commonUtils", () => {
  describe("clamp", () => {
    it("returns the value if it is within the range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns the min value if the value is below the range", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("returns the max value if the value is above the range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("returns the value if it equals the min", () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it("returns the value if it equals the max", () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it("handles negative ranges correctly", () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it("handles floating point numbers", () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
      expect(clamp(-0.5, 0, 10)).toBe(0);
      expect(clamp(10.5, 0, 10)).toBe(10);
    });

    it("handles the case where min equals max", () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(0, 5, 5)).toBe(5);
      expect(clamp(10, 5, 5)).toBe(5);
    });
  });
});
