import { isMonthYear } from "../helpers.mjs";

describe("isMonthYear", () => {
  it("returns true for valid MM-YYYY formats", () => {
    expect(isMonthYear("01-2023")).toBe(true);
    expect(isMonthYear("12-1999")).toBe(true);
    expect(isMonthYear("05-2025")).toBe(true);
  });

  it("returns false for invalid string formats", () => {
    expect(isMonthYear("1-2023")).toBe(false); // missing leading zero
    expect(isMonthYear("13-202")).toBe(false); // year too short
    expect(isMonthYear("01/2023")).toBe(false); // wrong separator
    expect(isMonthYear("2023-01")).toBe(false); // wrong order
    expect(isMonthYear("01-2023 ")).toBe(false); // trailing space
    expect(isMonthYear(" 01-2023")).toBe(false); // leading space
    expect(isMonthYear("not-a-date")).toBe(false);
    expect(isMonthYear("")).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isMonthYear(null)).toBe(false);
    expect(isMonthYear(undefined)).toBe(false);
    expect(isMonthYear(122023)).toBe(false);
    expect(isMonthYear({})).toBe(false);
    expect(isMonthYear([])).toBe(false);
    expect(isMonthYear(new Date())).toBe(false);
  });
});
