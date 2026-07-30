/** True when the bundle was built on Vercel (Analytics / Speed Insights + same-origin /api). */
export function isVercelHostedBuild(): boolean {
  return process.env.VERCEL === "1";
}

/** Canonical production origin (custom domain on Vercel). Used for off-Vercel prod builds (e.g. CI). */
export const SITE_ORIGIN = "https://woods.engineer";
