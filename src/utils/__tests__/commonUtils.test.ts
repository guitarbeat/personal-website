import { cn } from "../commonUtils";

describe("commonUtils", () => {
  describe("cn", () => {
    it("returns the base class when no additional classes are provided", () => {
      expect(cn("base")).toBe("base");
    });

    it("combines base class with additional valid string classes", () => {
      expect(cn("base", "extra")).toBe("base extra");
      expect(cn("base", "one", "two")).toBe("base one two");
    });

    it("filters out falsy values (false, null, undefined, empty string)", () => {
      expect(cn("base", false)).toBe("base");
      expect(cn("base", null)).toBe("base");
      expect(cn("base", undefined)).toBe("base");
      expect(cn("base", "")).toBe("base");
    });

    it("filters out whitespace-only strings", () => {
      expect(cn("base", "   ")).toBe("base");
      expect(cn("base", "\t\n")).toBe("base");
    });

    it("handles conditional classes correctly", () => {
      const conditionTrue = true;
      const conditionFalse = false;

      expect(cn("base", conditionTrue && "active")).toBe("base active");
      expect(cn("base", conditionFalse && "inactive")).toBe("base");
    });

    it("trims the resulting string", () => {
      expect(cn(" base ", " extra ")).toBe("base   extra"); // Internal spaces preserved, result trimmed
      expect(cn("  base  ")).toBe("  base  "); // Base class not trimmed if no extra classes (current behavior)
    });

    it("handles mixed valid and invalid inputs", () => {
      expect(cn("base", "valid", false, null, "also-valid", undefined, "")).toBe(
        "base valid also-valid"
      );
    });

    it("handles empty base class correctly", () => {
      expect(cn("", "extra")).toBe("extra");
      expect(cn("   ", "extra")).toBe("extra");
    });
  });
});
