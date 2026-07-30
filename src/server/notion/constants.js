export const NOTION_API_BASE = "https://api.notion.com/v1";
export const NOTION_VERSION = "2022-06-28";

export const CACHE_CONTROL_HEADER =
  "public, s-maxage=300, stale-while-revalidate=3600";
export const HEALTH_DEGRADED_AFTER_SECONDS = 1800;
export const HEALTH_FAILED_AFTER_SECONDS = 86400;
export const SCHEMA_VERSION = 3;
export const SNAPSHOT_KEY = "content:snapshot:v3";
export const SNAPSHOT_META_KEY = "content:snapshot:meta:v3";

export const DATABASE_IDS = {
  projects: "29dda682bcf6806eaa2efe20631dab6c",
  work: "b589d1ef5ef64b35abcc88558bf5574f",
  about: "aab0a96e279d48b6833f6727e6301266",
};

export class ContentError extends Error {
  constructor(
    message,
    { code = "CONTENT_ERROR", status = 500, failureType, details } = {},
  ) {
    super(message);
    this.name = "ContentError";
    this.code = code;
    this.status = status;
    this.failureType = failureType || code.toLowerCase();
    this.details = details ?? null;
  }
}
