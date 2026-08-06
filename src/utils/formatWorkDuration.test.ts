import { formatWorkDuration } from "./formatWorkDuration";

describe("formatWorkDuration", () => {
  it("returns empty string for zero or negative months", () => {
    expect(formatWorkDuration(0)).toBe("");
    expect(formatWorkDuration(-5)).toBe("");
    expect(formatWorkDuration(-12)).toBe("");
  });

  it("formats months only (less than a year)", () => {
    expect(formatWorkDuration(1)).toBe("One Month");
    expect(formatWorkDuration(5)).toBe("Five Months");
    expect(formatWorkDuration(11)).toBe("Eleven Months");
    expect(formatWorkDuration(12)).toBe("One Year");
  });

  it("formats exact years", () => {
    expect(formatWorkDuration(12)).toBe("One Year");
    expect(formatWorkDuration(24)).toBe("Two Years");
    expect(formatWorkDuration(120)).toBe("Ten Years");
  });

  it("formats years and months combined", () => {
    expect(formatWorkDuration(13)).toBe("One Year, one month");
    expect(formatWorkDuration(25)).toBe("Two Years, one month");
    expect(formatWorkDuration(18)).toBe("One Year, six months");
    expect(formatWorkDuration(143)).toBe("Eleven Years, eleven months");
  });

  it("formats large values not in DURATION_WORDS array", () => {
    // 15 years = 180 months. 180 + 5 = 185
    expect(formatWorkDuration(185)).toBe("15 Years, five months");
    // 20 years = 240 months. 240 + 1 = 241
    expect(formatWorkDuration(241)).toBe("20 Years, one month");
  });
});
