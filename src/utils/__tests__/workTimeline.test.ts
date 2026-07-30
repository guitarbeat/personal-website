import { processWorkTimeline } from "../workTimeline";

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
