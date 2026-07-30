/** True when the bundle was built on Vercel (Analytics / Speed Insights scripts exist). */
export function isVercelHostedBuild(): boolean {
  return process.env.VERCEL === "1";
}

/** Production site origin (custom domain on Vercel). Used when building off-Vercel (e.g. CI). */
export const SITE_ORIGIN = "https://woods.engineer";

/** @deprecated Use SITE_ORIGIN — kept for existing imports. */
export const VERCEL_API_ORIGIN = SITE_ORIGIN;
