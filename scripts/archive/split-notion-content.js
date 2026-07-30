#!/usr/bin/env node
/**
 * One-off splitter: notionContent.js -> src/server/notion/*.js
 * Run once during refactor; kept for traceability.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const srcPath = path.join(ROOT, "src/server/notionContent.js");
const outDir = path.join(ROOT, "src/server/notion");
const lines = fs.readFileSync(srcPath, "utf8").split("\n");

function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

fs.mkdirSync(outDir, { recursive: true });

const constants = `${slice(1, 32)}
`;

const helpers = `${slice(34, 66)}
${slice(68, 203)}
function isMonthYear(value) {
  return typeof value === "string" && /^\\d{2}-\\d{4}$/.test(value);
}
${slice(204, 248)}
${slice(262, 301)}
`;

const transform = `${slice(251, 260)}
${slice(303, 417)}
`;

const validate = `${slice(419, 435)}
${slice(440, 817)}
`;

const api = `${slice(819, 1047)}
`;

const snapshot = `${slice(1049, 1376)}
`;

const auth = `import crypto from "node:crypto";

${slice(1378, 1406)}
`;

const telemetry = `${slice(1408, 1433)}
`;

const header = (imports, body) => `${imports}\n\n${body}`;

fs.writeFileSync(
  path.join(outDir, "constants.js"),
  header("", constants.trim()),
);
fs.writeFileSync(
  path.join(outDir, "helpers.js"),
  header('import { ContentError } from "./constants.js";', helpers.trim()),
);
fs.writeFileSync(
  path.join(outDir, "transform.js"),
  header(
    `import { ContentError, DATABASE_IDS } from "./constants.js";
import {
  convertToMMYYYY,
  extractBlockPlainText,
  extractCheckboxValue,
  extractFileUrl,
  extractMultiSelectNames,
  extractNumberValue,
  extractProjectHook,
  extractRichText,
  compareProjectRecords,
  compareWorkRecords,
} from "./helpers.js";`,
    transform.trim(),
  ),
);
fs.writeFileSync(
  path.join(outDir, "validate.js"),
  header('import { ContentError } from "./constants.js";', validate.trim()),
);
fs.writeFileSync(
  path.join(outDir, "api.js"),
  header(
    `import {
  ContentError,
  DATABASE_IDS,
  NOTION_API_BASE,
  NOTION_VERSION,
} from "./constants.js";
import { extractBlockPlainText, extractRichText, getNotionToken } from "./helpers.js";
import {
  getDatasetTransformer,
  prepareProjectsForPublicDisplay,
  prepareWorkForPublicDisplay,
  transformProjectsData,
  transformWorkData,
} from "./transform.js";
import { validateDatasetRecords, validateQueryBody } from "./validate.js";`,
    api.trim(),
  ),
);
fs.writeFileSync(
  path.join(outDir, "snapshot.js"),
  header(
    `import {
  ContentError,
  HEALTH_DEGRADED_AFTER_SECONDS,
  HEALTH_FAILED_AFTER_SECONDS,
  SCHEMA_VERSION,
  SNAPSHOT_KEY,
  SNAPSHOT_META_KEY,
} from "./constants.js";
import { getSnapshotAgeSeconds, parseJsonSafely, toIsoString } from "./helpers.js";
import { fetchAllContentData } from "./api.js";
import { validateContentData } from "./validate.js";`,
    snapshot.trim(),
  ),
);
fs.writeFileSync(path.join(outDir, "auth.js"), auth.trim());
fs.writeFileSync(
  path.join(outDir, "telemetry.js"),
  header('import { ContentError } from "./constants.js";', telemetry.trim()),
);

// Fix constants to export NOTION_API_BASE
const constantsPath = path.join(outDir, "constants.js");
let constantsBody = fs.readFileSync(constantsPath, "utf8");
constantsBody = constantsBody.replace(
  "const NOTION_API_BASE",
  "export const NOTION_API_BASE",
);
constantsBody = constantsBody.replace(
  "const NOTION_VERSION",
  "export const NOTION_VERSION",
);
fs.writeFileSync(constantsPath, constantsBody);

// Export parseJsonSafely and toIsoString from helpers
let helpersBody = fs.readFileSync(path.join(outDir, "helpers.js"), "utf8");
helpersBody = helpersBody.replace(
  "function parseJsonSafely",
  "export function parseJsonSafely",
);
helpersBody = helpersBody.replace(
  "function toIsoString",
  "export function toIsoString",
);
helpersBody = helpersBody.replace(
  "function extractRichText",
  "export function extractRichText",
);
fs.writeFileSync(path.join(outDir, "helpers.js"), helpersBody);

const barrel = `export {
  CACHE_CONTROL_HEADER,
  ContentError,
  DATABASE_IDS,
  HEALTH_DEGRADED_AFTER_SECONDS,
  HEALTH_FAILED_AFTER_SECONDS,
  SCHEMA_VERSION,
  SNAPSHOT_KEY,
  SNAPSHOT_META_KEY,
  getSnapshotAgeSeconds,
} from "./constants.js";

export { parseJsonSafely } from "./helpers.js";

export {
  queryNotionDatabase,
  fetchAllContentData,
} from "./api.js";

export {
  validateQueryBody,
  validateDatasetRecords,
  validateContentData,
} from "./validate.js";

export {
  createKvClient,
  readSnapshot,
  readSnapshotMetadata,
  refreshContentSnapshot,
  getContentResponse,
  getHealthSummary,
} from "./snapshot.js";

export { isAuthorizedCronRequest } from "./auth.js";

export { buildStructuredLog, createErrorPayload } from "./telemetry.js";
`;

fs.writeFileSync(path.join(outDir, "index.js"), barrel);

const facade = `export * from "./notion/index.js";
`;

fs.writeFileSync(srcPath, facade);
console.log("Split complete:", outDir);
