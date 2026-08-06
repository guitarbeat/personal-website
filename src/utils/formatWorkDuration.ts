const DURATION_WORDS = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
] as const;

function numberToWord(num: number): string {
  return num <= 12 ? DURATION_WORDS[num - 1] : num.toString();
}

function formatPart(num: number, singular: string, plural: string): string {
  if (num === 0) {
    return "";
  }

  const word = numberToWord(num);
  return `${word} ${num === 1 ? singular : plural}`;
}

/** Formats a job duration (in months) as human-readable text for the timeline. */
export function formatWorkDuration(months: number): string {
  if (months <= 0) return "";

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return formatPart(remainingMonths, "Month", "Months");
  }

  if (remainingMonths === 0) {
    return formatPart(years, "Year", "Years");
  }

  const yearText = formatPart(years, "Year", "Years");
  const monthText = formatPart(
    remainingMonths,
    "Month",
    "Months",
  ).toLowerCase();

  return `${yearText}, ${monthText}`;
}
