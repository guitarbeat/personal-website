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
});
