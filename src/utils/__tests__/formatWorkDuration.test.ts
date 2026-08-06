import { formatWorkDuration } from "../formatWorkDuration";

describe("formatWorkDuration", () => {
  it("formats months only", () => {
    expect(formatWorkDuration(6)).toBe("Six Months");
  });

  it("formats years only", () => {
    expect(formatWorkDuration(24)).toBe("Two Years");
  });

  it("formats years and months", () => {
    expect(formatWorkDuration(14)).toBe("One Year, two months");
  });

  it("uses numeric form above twelve months in the remainder", () => {
    expect(formatWorkDuration(13)).toBe("One Year, one month");
  });

  it("formats exactly one month", () => {
    expect(formatWorkDuration(1)).toBe("One Month");
  });

  it("formats exactly one year", () => {
    expect(formatWorkDuration(12)).toBe("One Year");
  });

  it("returns empty string for 0 months", () => {
    expect(formatWorkDuration(0)).toBe("");
  });

  it("returns empty string for negative months", () => {
    expect(formatWorkDuration(-5)).toBe("");
  });

  it("formats large amounts of months", () => {
    expect(formatWorkDuration(240)).toBe("20 Years");
    expect(formatWorkDuration(241)).toBe("20 Years, one month");
  });
});
