/**
 * @jest-environment node
 */
import { isAboveBreakpoint } from "../commonUtils";

describe("commonUtils (node environment)", () => {
  describe("isAboveBreakpoint", () => {
    it("returns false when window is undefined", () => {
      // In node environment, window is not defined by default
      expect(typeof window).toBe("undefined");
      expect(isAboveBreakpoint(768)).toBe(false);
    });
  });
});
