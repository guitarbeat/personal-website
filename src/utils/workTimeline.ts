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

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

/** Formats a work timeline month label (e.g. `Jan 2020`). */
export function formatWorkMonthLabel(date: Date): string {
  return monthFormatter.format(date);
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
  const count = rawJobs.length;
  if (count === 0) {
    return { jobs: [], firstDate: now, jobBars: [] };
  }

  const jobs: ProcessedWorkJob[] = new Array(count);
  let firstDate = now;

  for (let i = 0; i < count; i++) {
    const rawJob = rawJobs[i];
    if (!rawJob) continue;
    const fromDate = parseWorkMonth(rawJob.from);
    const toDate = rawJob.to ? parseWorkMonth(rawJob.to) : now;

    if (firstDate.getTime() > fromDate.getTime()) {
      firstDate = fromDate;
    }

    const from = formatWorkMonthLabel(fromDate);
    const to = rawJob.to ? formatWorkMonthLabel(toDate) : "Now";
    const durationDiff = diffWorkMonths(fromDate, toDate);
    const duration = durationDiff === 0 ? 1 : durationDiff;
    const date = durationDiff === 0 ? from : `${from} - ${to}`;

    jobs[i] = {
      slug: rawJob.slug,
      title: rawJob.title,
      company: rawJob.company,
      place: rawJob.place,
      from,
      to,
      fromDate,
      toDate,
      date,
      duration,
      bar_start: 0,
      bar_height: 0,
      description: rawJob.description,
    };
  }

  const timeSpan = diffWorkMonths(firstDate, now);
  const safeTimeSpan = timeSpan === 0 ? 1 : timeSpan;
  const jobBars: number[][] = new Array(count);

  for (let i = 0; i < count; i++) {
    const job = jobs[i];
    if (!job) continue;

    const bar_start =
      (100 * diffWorkMonths(firstDate, job.fromDate)) / safeTimeSpan;
    const bar_height = (100 * job.duration) / safeTimeSpan;

    job.bar_start = bar_start;
    job.bar_height = bar_height;
    jobBars[i] = [bar_height, bar_start];
  }

  return { jobs, firstDate, jobBars };
}
