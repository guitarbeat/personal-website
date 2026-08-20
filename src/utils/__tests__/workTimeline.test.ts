import { diffWorkMonths, processWorkTimeline } from "../workTimeline";

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
});

describe("diffWorkMonths", () => {
  it("calculates difference in the same year", () => {
    const from = new Date(2020, 0, 1); // Jan 2020
    const to = new Date(2020, 5, 1); // Jun 2020
    expect(diffWorkMonths(from, to)).toBe(5);
  });

  it("calculates difference across multiple years", () => {
    const from = new Date(2020, 0, 1); // Jan 2020
    const to = new Date(2022, 2, 1); // Mar 2022
    expect(diffWorkMonths(from, to)).toBe(26); // 2 * 12 + 2
  });

  it("returns negative values if to is before from", () => {
    const from = new Date(2020, 5, 1); // Jun 2020
    const to = new Date(2020, 0, 1); // Jan 2020
    expect(diffWorkMonths(from, to)).toBe(-5);
  });

  it("returns 0 for the same month and year", () => {
    const from = new Date(2020, 0, 1); // Jan 2020
    const to = new Date(2020, 0, 15); // Jan 2020
    expect(diffWorkMonths(from, to)).toBe(0);
  });
});
