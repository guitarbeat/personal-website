import { isMonthYear } from "../helpers.mjs";

describe("isMonthYear", () => {
  it("returns true for valid MM-YYYY strings", () => {
    expect(isMonthYear("01-2023")).toBe(true);
    expect(isMonthYear("12-1999")).toBe(true);
    expect(isMonthYear("99-9999")).toBe(true);
  });

  it("returns false for invalid string formats", () => {
    expect(isMonthYear("1-2023")).toBe(false);
    expect(isMonthYear("01/2023")).toBe(false);
    expect(isMonthYear("2023-01")).toBe(false);
    expect(isMonthYear(" 01-2023 ")).toBe(false);
    expect(isMonthYear("01-2023a")).toBe(false);
    expect(isMonthYear("a01-2023")).toBe(false);
    expect(isMonthYear("123-2023")).toBe(false);
    expect(isMonthYear("01-23")).toBe(false);
  });

  it("returns false for non-string inputs", () => {
    expect(isMonthYear(null)).toBe(false);
    expect(isMonthYear(undefined)).toBe(false);
    expect(isMonthYear(122023)).toBe(false);
    expect(isMonthYear({})).toBe(false);
    expect(isMonthYear([])).toBe(false);
    expect(isMonthYear(true)).toBe(false);
  });
});
