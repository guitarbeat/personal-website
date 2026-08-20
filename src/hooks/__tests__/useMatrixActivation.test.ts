import { shouldShowMatrixFromSearch } from "../useMatrixActivation";

describe("shouldShowMatrixFromSearch", () => {
  it("returns false if no matrix parameter is present", () => {
    expect(shouldShowMatrixFromSearch("")).toBe(false);
    expect(shouldShowMatrixFromSearch("?other=1")).toBe(false);
    expect(shouldShowMatrixFromSearch(new URLSearchParams("?other=1"))).toBe(false);
  });

  it("returns false if matrix parameter is present but empty", () => {
    expect(shouldShowMatrixFromSearch("?matrix=")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix")).toBe(false);
  });

  it("returns false if matrix parameter only has spaces", () => {
    expect(shouldShowMatrixFromSearch("?matrix=   ")).toBe(false);
  });

  describe("enabled values", () => {
    const enabledValues = ["1", "true", "on", "yes"];

    it.each(enabledValues)("returns true for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=${value}`)).toBe(true);
    });

    it.each(enabledValues)("handles uppercase/mixed case correctly for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=${value.toUpperCase()}`)).toBe(true);
      if (value.length > 1) {
        const mixedCase = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        expect(shouldShowMatrixFromSearch(`?matrix=${mixedCase}`)).toBe(true);
      }
    });

    it.each(enabledValues)("trims whitespace for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=  ${value}  `)).toBe(true);
    });
  });

  describe("disabled values", () => {
    const disabledValues = ["0", "false", "off", "no"];

    it.each(disabledValues)("returns false for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=${value}`)).toBe(false);
    });

    it.each(disabledValues)("handles uppercase/mixed case correctly for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=${value.toUpperCase()}`)).toBe(false);
    });

    it.each(disabledValues)("trims whitespace for %s", (value) => {
      expect(shouldShowMatrixFromSearch(`?matrix=  ${value}  `)).toBe(false);
    });
  });

  it("returns false for unrecognized values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=maybe")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=2")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=random")).toBe(false);
  });

  it("handles URLSearchParams object input correctly", () => {
    const params = new URLSearchParams("?matrix=true");
    expect(shouldShowMatrixFromSearch(params)).toBe(true);
  });
});
