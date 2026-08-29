/**
 * @jest-environment node
 */
import { prefersReducedMotion } from "../motion";

describe("motion utilities (node environment)", () => {
  describe("prefersReducedMotion", () => {
    it("returns false when window is undefined", () => {
      expect(typeof window).toBe("undefined");
      expect(prefersReducedMotion()).toBe(false);
    });
  });
});
