import { processWorkTimeline, parseWorkMonth } from "../workTimeline";

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

describe("parseWorkMonth", () => {
  it("parses valid MM-YYYY formats correctly", () => {
    expect(parseWorkMonth("01-2020")).toEqual(new Date(2020, 0, 1));
    expect(parseWorkMonth("12-2021")).toEqual(new Date(2021, 11, 1));
  });

  it("returns Invalid Date for empty string", () => {
    expect(parseWorkMonth("").getTime()).toBeNaN();
  });

  it("returns Invalid Date for invalid delimiters", () => {
    expect(parseWorkMonth("01/2020").getTime()).toBeNaN();
  });

  it("returns Invalid Date for missing parts", () => {
    expect(parseWorkMonth("2020").getTime()).toBeNaN();
    expect(parseWorkMonth("-2020").getTime()).toBeNaN();
    expect(parseWorkMonth("01-").getTime()).toBeNaN();
  });

  it("returns Invalid Date for non-numeric input", () => {
    expect(parseWorkMonth("Jan-2020").getTime()).toBeNaN();
  });
});
