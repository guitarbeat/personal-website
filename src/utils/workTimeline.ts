/** Parses Notion work dates in `MM-YYYY` format. */
export function parseWorkMonth(value: string): Date {
  const [month, year] = value.split("-").map(Number);

  if (!month || !year) {
    return new Date(Number.NaN);
  }

  return new Date(year, month - 1, 1);
}

/** Whole-month difference between two dates (matches legacy moment diff). */
export function diffWorkMonths(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

/** Formats a work timeline month label (e.g. `Jan 2020`). */
export function formatWorkMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Formats the calendar year for timeline axis labels. */
export function formatWorkYear(date: Date): string {
  return String(date.getFullYear());
}

export interface ProcessedWorkJob {
  slug: string;
  title: string;
  company: string;
  place: string;
  from: string;
  to: string;
  fromDate: Date;
  toDate: Date;
  date: string;
  duration: number;
  bar_start: number;
  bar_height: number;
  description: string;
}

export interface ProcessedWorkTimeline {
  jobs: ProcessedWorkJob[];
  firstDate: Date;
  jobBars: number[][];
}

/** Transforms raw Notion work rows into timeline layout data. */
export function processWorkTimeline(
  rawJobs: Array<{
    slug: string;
    title: string;
    company: string;
    place: string;
    from: string;
    to: string | null;
    description: string;
  }>,
): ProcessedWorkTimeline {
  const now = new Date();
  const jobs: ProcessedWorkJob[] = rawJobs.map((job) => {
    const fromDate = parseWorkMonth(job.from);
    const toDate = job.to ? parseWorkMonth(job.to) : now;

    return {
      slug: job.slug,
      title: job.title,
      company: job.company,
      place: job.place,
      from: formatWorkMonthLabel(fromDate),
      to: job.to ? formatWorkMonthLabel(toDate) : "Now",
      fromDate,
      toDate,
      date: "",
      duration: 0,
      bar_start: 0,
      bar_height: 0,
      description: job.description,
    };
  });

  let firstDate = now;

  for (const job of jobs) {
    const duration = diffWorkMonths(job.fromDate, job.toDate);

    job.date = duration === 0 ? job.from : `${job.from} - ${job.to}`;
    job.duration = duration === 0 ? 1 : duration;

    if (firstDate.getTime() > job.fromDate.getTime()) {
      firstDate = job.fromDate;
    }
  }

  const timeSpan = diffWorkMonths(firstDate, now);
  const safeTimeSpan = timeSpan === 0 ? 1 : timeSpan;

  const jobBars = jobs.map((job) => {
    job.bar_start =
      (100 * diffWorkMonths(firstDate, job.fromDate)) / safeTimeSpan;
    job.bar_height = (100 * job.duration) / safeTimeSpan;
    return [job.bar_height, job.bar_start];
  });

  return { jobs, firstDate, jobBars };
}
