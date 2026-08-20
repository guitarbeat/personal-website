import { processWorkTimeline, formatWorkYear } from "../workTimeline";

describe("workTimeline", () => {
  it("processes MM-YYYY work rows into timeline bars", () => {
    const { jobs, jobBars } = processWorkTimeline([
      {
        slug: "job-a",
        title: "Engineer",
        company: "Acme",
        place: "Remote",
        from: "01-2020",
        to: "06-2021",
        description: "Built things.",
      },
    ]);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.from).toBe("Jan 2020");
    expect(jobs[0]?.to).toBe("Jun 2021");
    expect(jobs[0]?.duration).toBeGreaterThan(0);
    expect(jobBars[0]).toEqual([jobs[0]?.bar_height, jobs[0]?.bar_start]);
  });

  describe("formatWorkYear", () => {
    it("formats the calendar year for timeline axis labels", () => {
      expect(formatWorkYear(new Date(2020, 0, 1))).toBe("2020");
      expect(formatWorkYear(new Date(1999, 11, 31))).toBe("1999");
      expect(formatWorkYear(new Date(2025, 5, 15))).toBe("2025");
    });
  });
});
