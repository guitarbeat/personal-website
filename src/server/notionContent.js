const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

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

function parseJsonSafely(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

function toIsoString(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

export function getSnapshotAgeSeconds(
  snapshotUpdatedAt,
  now = new Date().toISOString(),
) {
  if (!snapshotUpdatedAt) {
    return null;
  }

  const currentTime = new Date(now).getTime();
  const snapshotTime = new Date(snapshotUpdatedAt).getTime();

  if (Number.isNaN(currentTime) || Number.isNaN(snapshotTime)) {
    return null;
  }

  return Math.max(0, Math.floor((currentTime - snapshotTime) / 1000));
}

function getNotionToken(env = process.env) {
  return env.NOTION_TOKEN || env.REACT_APP_NOTION_TOKEN || "";
}

function extractRichText(richTextArray) {
  if (!Array.isArray(richTextArray)) {
    return "";
  }

  return richTextArray.map((item) => item?.plain_text || "").join("");
}

function extractFileUrl(fileList) {
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return null;
  }

  const firstFile = fileList[0];

  if (firstFile?.file?.url) {
    return firstFile.file.url;
  }

  if (firstFile?.external?.url) {
    return firstFile.external.url;
  }

  return null;
}

function extractMultiSelectNames(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => option?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

function extractCheckboxValue(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate?.checkbox === "boolean") {
      return candidate.checkbox;
    }
  }

  return null;
}

function extractNumberValue(...candidates) {
  for (const candidate of candidates) {
    if (
      typeof candidate?.number === "number" &&
      Number.isFinite(candidate.number)
    ) {
      return candidate.number;
    }
  }

  return null;
}

function extractProjectHook(rawHook, detail, title) {
  const explicitHook = rawHook.trim();

  if (explicitHook.length > 0) {
    return explicitHook;
  }

  const fallbackParagraph = detail
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph.length > 0);

  if (fallbackParagraph) {
    return fallbackParagraph;
  }

  return title;
}

function projectDateSortValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsedDate = Date.parse(value);

  if (!Number.isNaN(parsedDate)) {
    return parsedDate;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  return value;
}

function compareProjectRecords(a, b) {
  const sortOrderA =
    typeof a.sortOrder === "number" ? a.sortOrder : Number.POSITIVE_INFINITY;
  const sortOrderB =
    typeof b.sortOrder === "number" ? b.sortOrder : Number.POSITIVE_INFINITY;

  if (sortOrderA !== sortOrderB) {
    return sortOrderA - sortOrderB;
  }

  const dateA = projectDateSortValue(a.date);
  const dateB = projectDateSortValue(b.date);

  if (typeof dateA === "number" && typeof dateB === "number") {
    if (dateA !== dateB) {
      return dateB - dateA;
    }
  } else {
    const stringCompare = String(b.date ?? "").localeCompare(
      String(a.date ?? ""),
    );

    if (stringCompare !== 0) {
      return stringCompare;
    }
  }

  return String(a.title).localeCompare(String(b.title));
}

function workMonthSortValue(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  if (!isMonthYear(value)) {
    return null;
  }

  const [month, year] = value.split("-").map(Number);

  if (!Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  return year * 100 + month;
}

function compareWorkRecords(a, b) {
  const isCurrentA = !a.to;
  const isCurrentB = !b.to;

  if (isCurrentA !== isCurrentB) {
    return isCurrentA ? -1 : 1;
  }

  const toA = workMonthSortValue(a.to);
  const toB = workMonthSortValue(b.to);

  if (typeof toA === "number" && typeof toB === "number" && toA !== toB) {
    return toB - toA;
  }

  const fromA = workMonthSortValue(a.from);
  const fromB = workMonthSortValue(b.from);

  if (
    typeof fromA === "number" &&
    typeof fromB === "number" &&
    fromA !== fromB
  ) {
    return fromB - fromA;
  }

  return String(a.title).localeCompare(String(b.title));
}

function prepareProjectsForPublicDisplay(records) {
  return records
    .filter((record) => record.published !== false)
    .sort(compareProjectRecords)
    .map(({ published, sortOrder, ...publicRecord }) => publicRecord);
}

function prepareWorkForPublicDisplay(records) {
  return [...records].sort(compareWorkRecords);
}

function convertToMMYYYY(dateString) {
  if (!dateString) {
    return null;
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return null;
  }

  return `${parts[1]}-${parts[0]}`;
}

const TEXT_BLOCK_TYPES = [
  "bulleted_list_item",
  "callout",
  "heading_1",
  "heading_2",
  "heading_3",
  "numbered_list_item",
  "paragraph",
  "quote",
  "to_do",
  "toggle",
];

function extractBlockPlainText(block) {
  if (!block || typeof block !== "object") {
    return "";
  }

  const blockType = typeof block.type === "string" ? block.type : "";

  if (!TEXT_BLOCK_TYPES.includes(blockType)) {
    return "";
  }

  return extractRichText(block[blockType]?.rich_text || []);
}

function transformProjectsData(results, projectContentByPageId = new Map()) {
  return results.map((page) => {
    const props = page.properties || {};
    const titleText =
      props.title?.title?.[0]?.plain_text ||
      props.Name?.title?.[0]?.plain_text ||
      "";
    const detail =
      extractRichText(
        props.Detail?.rich_text ||
          props.detail?.rich_text ||
          props.content?.rich_text ||
          props.Description?.rich_text ||
          [],
      ) || projectContentByPageId.get(page.id) || "";
    const rawHook = extractRichText(props.Hook?.rich_text || props.hook?.rich_text || []);

    return {
      title: titleText,
      hook: extractProjectHook(rawHook, detail, titleText),
      detail,
      date:
        props.date?.number ||
        props.Date?.number ||
        props.date?.date?.start ||
        props.Date?.date?.start ||
        null,
      link: props.link?.url || props.Link?.url || null,
      slug:
        extractRichText(props.slug?.rich_text || props.Slug?.rich_text || []) ||
        page.id,
      image:
        extractFileUrl(props.Image?.files || props.image?.files || []) ||
        extractRichText(
          props.image?.rich_text || props.Image?.rich_text || [],
        ) ||
        null,
      keywords: extractMultiSelectNames(
        props.Keyword?.multi_select || props.keyword?.multi_select || [],
      ),
      published:
        extractCheckboxValue(props.Published, props.published) ?? true,
      sortOrder: extractNumberValue(
        props["Sort Order"],
        props.SortOrder,
        props.sortOrder,
      ),
    };
  });
}

function transformWorkData(results) {
  return results.map((page) => {
    const props = page.properties || {};
    const fromDate = props.From?.date?.start || props.from?.date?.start || "";
    const toDate = props.To?.date?.start || props.to?.date?.start || "";

    return {
      title:
        props.title?.title?.[0]?.plain_text ||
        props.Title?.title?.[0]?.plain_text ||
        "",
      company: extractRichText(props.Company?.rich_text || []),
      description: extractRichText(props.Description?.rich_text || []),
      from: convertToMMYYYY(fromDate),
      to: convertToMMYYYY(toDate),
      place: extractRichText(props.Place?.rich_text || []),
      slug:
        extractRichText(props.slug?.rich_text || props.Slug?.rich_text || []) ||
        page.id,
    };
  });
}

function transformAboutData(results) {
  return results.map((page) => {
    const props = page.properties || {};

    return {
      category:
        props.Category?.title?.[0]?.plain_text ||
        props.category?.title?.[0]?.plain_text ||
        "",
      description: extractRichText(
        props.Description?.rich_text ||
          props.Text?.rich_text ||
          props.Content?.rich_text ||
          [],
      ),
    };
  });
}

function getDatasetTransformer(databaseType) {
  switch (databaseType) {
    case "projects":
      return transformProjectsData;
    case "work":
      return transformWorkData;
    case "about":
      return transformAboutData;
    default:
      throw new ContentError(`Invalid database type: ${databaseType}`, {
        code: "INVALID_DATABASE",
        status: 400,
        failureType: "invalid_database",
        details: {
          validTypes: Object.keys(DATABASE_IDS),
        },
      });
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value) {
  return value === null || value === undefined || typeof value === "string";
}

function isProjectDate(value) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number"
  );
}

function isMonthYear(value) {
  return typeof value === "string" && /^\d{2}-\d{4}$/.test(value);
}

function isKeywordList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (keyword) => typeof keyword === "string" && keyword.trim().length > 0,
    )
  );
}

function assertValidRecord(condition, dataset, index, field, message, value) {
  if (condition) {
    return;
  }

  throw new ContentError(message, {
    code: "CONTENT_VALIDATION_ERROR",
    status: 502,
    failureType: "validation_failed",
    details: {
      dataset,
      index,
      field,
      value,
    },
  });
}

function validateAboutRecords(records) {
  records.forEach((record, index) => {
    assertValidRecord(
      isNonEmptyString(record.category),
      "about",
      index,
      "category",
      "About category must be a non-empty string.",
      record.category,
    );
    assertValidRecord(
      typeof record.description === "string",
      "about",
      index,
      "description",
      "About description must be a string.",
      record.description,
    );
  });
}

function validateProjectRecords(records) {
  records.forEach((record, index) => {
    assertValidRecord(
      isNonEmptyString(record.title),
      "projects",
      index,
      "title",
      "Project title must be a non-empty string.",
      record.title,
    );
    assertValidRecord(
      isNonEmptyString(record.slug),
      "projects",
      index,
      "slug",
      "Project slug must be a non-empty string.",
      record.slug,
    );
    assertValidRecord(
      isNonEmptyString(record.hook),
      "projects",
      index,
      "hook",
      "Project hook must be a non-empty string.",
      record.hook,
    );
    assertValidRecord(
      typeof record.detail === "string",
      "projects",
      index,
      "detail",
      "Project detail must be a string.",
      record.detail,
    );
    assertValidRecord(
      isProjectDate(record.date),
      "projects",
      index,
      "date",
      "Project date must be a string, number, or null.",
      record.date,
    );
    assertValidRecord(
      isOptionalString(record.link),
      "projects",
      index,
      "link",
      "Project link must be a string or null.",
      record.link,
    );
    assertValidRecord(
      isOptionalString(record.image),
      "projects",
      index,
      "image",
      "Project image must be a string or null.",
      record.image,
    );
    assertValidRecord(
      isKeywordList(record.keywords),
      "projects",
      index,
      "keywords",
      "Project keywords must be an array of non-empty strings.",
      record.keywords,
    );
  });
}

function validateWorkRecords(records) {
  records.forEach((record, index) => {
    assertValidRecord(
      isNonEmptyString(record.title),
      "work",
      index,
      "title",
      "Work title must be a non-empty string.",
      record.title,
    );
    assertValidRecord(
      isNonEmptyString(record.slug),
      "work",
      index,
      "slug",
      "Work slug must be a non-empty string.",
      record.slug,
    );
    assertValidRecord(
      typeof record.company === "string",
      "work",
      index,
      "company",
      "Work company must be a string.",
      record.company,
    );
    assertValidRecord(
      typeof record.description === "string",
      "work",
      index,
      "description",
      "Work description must be a string.",
      record.description,
    );
    assertValidRecord(
      isMonthYear(record.from),
      "work",
      index,
      "from",
      "Work from date must be in MM-YYYY format.",
      record.from,
    );
    assertValidRecord(
      record.to === null || record.to === "" || isMonthYear(record.to),
      "work",
      index,
      "to",
      "Work to date must be null, empty, or in MM-YYYY format.",
      record.to,
    );
    assertValidRecord(
      typeof record.place === "string",
      "work",
      index,
      "place",
      "Work place must be a string.",
      record.place,
    );
  });
}

export function validateDatasetRecords(databaseType, records) {
  if (!Array.isArray(records)) {
    throw new ContentError(`Dataset "${databaseType}" must be an array.`, {
      code: "CONTENT_VALIDATION_ERROR",
      status: 502,
      failureType: "validation_failed",
      details: {
        dataset: databaseType,
      },
    });
  }

  switch (databaseType) {
    case "about":
      validateAboutRecords(records);
      break;
    case "projects":
      validateProjectRecords(records);
      break;
    case "work":
      validateWorkRecords(records);
      break;
    default:
      throw new ContentError(`Unknown dataset "${databaseType}".`, {
        code: "INVALID_DATABASE",
        status: 400,
        failureType: "invalid_database",
      });
  }

  return records;
}

export function validateContentData(data) {
  if (!data || typeof data !== "object") {
    throw new ContentError("Content payload must be an object.", {
      code: "CONTENT_VALIDATION_ERROR",
      status: 502,
      failureType: "validation_failed",
    });
  }

  validateDatasetRecords("about", data.about || []);
  validateDatasetRecords("projects", data.projects || []);
  validateDatasetRecords("work", data.work || []);

  return data;
}

function validateSorts(sorts) {
  if (!Array.isArray(sorts)) {
    return undefined;
  }

  return sorts
    .map((sort) => {
      if (!sort || typeof sort !== "object") {
        return null;
      }

      const { property, timestamp, direction } = sort;

      if (direction !== "ascending" && direction !== "descending") {
        return null;
      }

      const nextSort = { direction };

      if (typeof property === "string") {
        nextSort.property = property;
      } else if (
        timestamp === "created_time" ||
        timestamp === "last_edited_time"
      ) {
        nextSort.timestamp = timestamp;
      } else {
        return null;
      }

      return nextSort;
    })
    .filter(Boolean);
}

const ALLOWED_FILTER_TYPES = [
  "title",
  "rich_text",
  "url",
  "email",
  "phone_number",
  "number",
  "checkbox",
  "select",
  "multi_select",
  "status",
  "date",
  "people",
  "files",
  "relation",
];

function validateFilter(filter, depth = 0) {
  if (depth > 2 || !filter || typeof filter !== "object") {
    return null;
  }

  if (Array.isArray(filter.and)) {
    const validAnd = filter.and
      .map((entry) => validateFilter(entry, depth + 1))
      .filter(Boolean);

    return validAnd.length > 0 ? { and: validAnd } : null;
  }

  if (Array.isArray(filter.or)) {
    const validOr = filter.or
      .map((entry) => validateFilter(entry, depth + 1))
      .filter(Boolean);

    return validOr.length > 0 ? { or: validOr } : null;
  }

  if (typeof filter.property === "string") {
    const nextFilter = { property: filter.property };
    let hasType = false;

    for (const key of Object.keys(filter)) {
      if (
        ALLOWED_FILTER_TYPES.includes(key) &&
        filter[key] &&
        typeof filter[key] === "object"
      ) {
        try {
          nextFilter[key] = JSON.parse(JSON.stringify(filter[key]));
          hasType = true;
        } catch (_error) {}
      }
    }

    return hasType ? nextFilter : null;
  }

  if (
    filter.timestamp === "created_time" ||
    filter.timestamp === "last_edited_time"
  ) {
    const nextFilter = { timestamp: filter.timestamp };
    const timestampKey = filter.timestamp;

    if (filter[timestampKey] && typeof filter[timestampKey] === "object") {
      try {
        nextFilter[timestampKey] = JSON.parse(
          JSON.stringify(filter[timestampKey]),
        );
        return nextFilter;
      } catch (_error) {
        return null;
      }
    }
  }

  return null;
}

export function validateQueryBody(body) {
  if (!body || typeof body !== "object") {
    return { page_size: 100 };
  }

  const validated = {};

  if (body.page_size && typeof body.page_size === "number") {
    validated.page_size = Math.min(
      Math.max(Math.floor(body.page_size), 1),
      100,
    );
  } else {
    validated.page_size = 100;
  }

  if (body.filter && typeof body.filter === "object") {
    const validFilter = validateFilter(body.filter);

    if (validFilter) {
      validated.filter = validFilter;
    }
  }

  if (body.sorts && Array.isArray(body.sorts)) {
    const validSorts = validateSorts(body.sorts);

    if (validSorts && validSorts.length > 0) {
      validated.sorts = validSorts;
    }
  }

  return validated;
}

async function parseResponseJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

async function fetchNotionBlockChildren({
  blockId,
  fetchImpl = fetch,
  notionToken,
}) {
  const rawBlocks = [];
  let nextCursor = null;
  let hasMore = true;

  while (hasMore) {
    const query = new URLSearchParams({ page_size: "100" });

    if (nextCursor) {
      query.set("start_cursor", nextCursor);
    }

    let response;

    try {
      response = await fetchImpl(
        `${NOTION_API_BASE}/blocks/${blockId}/children?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": NOTION_VERSION,
          },
        },
      );
    } catch (error) {
      throw new ContentError("Failed to reach Notion block API.", {
        code: "NOTION_REQUEST_FAILED",
        status: 502,
        failureType: "notion_request_failed",
        details: {
          blockId,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }

    const data = await parseResponseJson(response);

    if (!response.ok) {
      throw new ContentError("Notion block request failed.", {
        code: "NOTION_API_ERROR",
        status: response.status,
        failureType: "notion_api_error",
        details: {
          blockId,
          response: data,
        },
      });
    }

    rawBlocks.push(...(Array.isArray(data?.results) ? data.results : []));
    nextCursor = data?.next_cursor || null;
    hasMore = Boolean(data?.has_more && nextCursor);
  }

  return rawBlocks;
}

async function fetchProjectContentByPageId({
  pages,
  fetchImpl = fetch,
  notionToken,
}) {
  const contentEntries = await Promise.all(
    pages.map(async (page) => {
      const props = page.properties || {};
      const inlineContent = extractRichText(
        props.Detail?.rich_text ||
          props.detail?.rich_text ||
          props.content?.rich_text ||
          props.Description?.rich_text ||
          [],
      );

      if (inlineContent) {
        return [page.id, inlineContent];
      }

      const blocks = await fetchNotionBlockChildren({
        blockId: page.id,
        fetchImpl,
        notionToken,
      });
      const pageContent = blocks
        .map(extractBlockPlainText)
        .filter((blockText) => typeof blockText === "string" && blockText.length)
        .join("\n\n");

      return [page.id, pageContent];
    }),
  );

  return new Map(contentEntries);
}

export async function queryNotionDatabase({
  databaseType,
  requestBody = {},
  fetchImpl = fetch,
  env = process.env,
}) {
  const databaseId = DATABASE_IDS[databaseType];
  const notionToken = getNotionToken(env);

  if (!databaseId) {
    throw new ContentError(`Invalid database type: ${databaseType}`, {
      code: "INVALID_DATABASE",
      status: 400,
      failureType: "invalid_database",
      details: {
        validTypes: Object.keys(DATABASE_IDS),
      },
    });
  }

  if (!notionToken) {
    throw new ContentError("Notion token not configured.", {
      code: "NOTION_TOKEN_MISSING",
      status: 500,
      failureType: "notion_token_missing",
    });
  }

  const baseBody = validateQueryBody(requestBody);
  const rawResults = [];
  let nextCursor = null;
  let hasMore = true;

  while (hasMore) {
    const requestPayload = nextCursor
      ? { ...baseBody, start_cursor: nextCursor }
      : baseBody;

    let response;

    try {
      response = await fetchImpl(
        `${NOTION_API_BASE}/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );
    } catch (error) {
      throw new ContentError("Failed to reach Notion API.", {
        code: "NOTION_REQUEST_FAILED",
        status: 502,
        failureType: "notion_request_failed",
        details: {
          databaseType,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }

    const data = await parseResponseJson(response);

    if (!response.ok) {
      throw new ContentError("Notion API request failed.", {
        code: "NOTION_API_ERROR",
        status: response.status,
        failureType: "notion_api_error",
        details: {
          databaseType,
          response: data,
        },
      });
    }

    rawResults.push(...(Array.isArray(data?.results) ? data.results : []));
    nextCursor = data?.next_cursor || null;
    hasMore = Boolean(data?.has_more && nextCursor);
  }

  const records =
    databaseType === "projects"
      ? prepareProjectsForPublicDisplay(
          transformProjectsData(
            rawResults,
            await fetchProjectContentByPageId({
              pages: rawResults,
              fetchImpl,
              notionToken,
            }),
          ),
        )
      : databaseType === "work"
        ? prepareWorkForPublicDisplay(transformWorkData(rawResults))
      : getDatasetTransformer(databaseType)(rawResults);

  return validateDatasetRecords(databaseType, records);
}

export async function fetchAllContentData({
  fetchImpl = fetch,
  env = process.env,
}) {
  const [about, projects, work] = await Promise.all([
    queryNotionDatabase({ databaseType: "about", fetchImpl, env }),
    queryNotionDatabase({ databaseType: "projects", fetchImpl, env }),
    queryNotionDatabase({ databaseType: "work", fetchImpl, env }),
  ]);

  return validateContentData({
    about,
    projects,
    work,
  });
}

function createDatasetCounts(data) {
  return {
    about: data.about.length,
    projects: data.projects.length,
    work: data.work.length,
  };
}

function createSnapshotEnvelope(data, updatedAt) {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt,
    datasetCounts: createDatasetCounts(data),
    data,
  };
}

function createSnapshotMetadata(snapshot) {
  return {
    schemaVersion: SCHEMA_VERSION,
    snapshotExists: true,
    updatedAt: snapshot.updatedAt,
    datasetCounts: snapshot.datasetCounts,
  };
}

function createContentMeta({ source, degraded, fetchedAt, snapshotUpdatedAt }) {
  return {
    source,
    degraded,
    fetchedAt,
    snapshotUpdatedAt,
    snapshotAgeSeconds: getSnapshotAgeSeconds(snapshotUpdatedAt, fetchedAt),
    schemaVersion: SCHEMA_VERSION,
  };
}

async function runKvCommand(command, { fetchImpl = fetch, env = process.env }) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new ContentError("KV is not configured.", {
      code: "KV_NOT_CONFIGURED",
      status: 500,
      failureType: "kv_not_configured",
    });
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const data = await parseResponseJson(response);

  if (!response.ok || data?.error) {
    throw new ContentError("KV command failed.", {
      code: "KV_COMMAND_FAILED",
      status: response.status || 502,
      failureType: "kv_command_failed",
      details: {
        command: command[0],
        response: data,
      },
    });
  }

  return data?.result ?? null;
}

export function createKvClient({ fetchImpl = fetch, env = process.env } = {}) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    async getJson(key) {
      const value = await runKvCommand(["GET", key], { fetchImpl, env });
      return parseJsonSafely(value);
    },
    async setJson(key, value) {
      await runKvCommand(["SET", key, JSON.stringify(value)], {
        fetchImpl,
        env,
      });
    },
  };
}

export async function readSnapshot({ kvClient }) {
  if (!kvClient) {
    return null;
  }

  const snapshot = await kvClient.getJson(SNAPSHOT_KEY);

  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  if (!snapshot.updatedAt || !snapshot.data) {
    throw new ContentError("Stored snapshot is malformed.", {
      code: "SNAPSHOT_INVALID",
      status: 503,
      failureType: "snapshot_invalid",
    });
  }

  validateContentData(snapshot.data);

  return snapshot;
}

export async function readSnapshotMetadata({ kvClient }) {
  if (!kvClient) {
    return null;
  }

  const metadata = await kvClient.getJson(SNAPSHOT_META_KEY);

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return metadata;
}

export async function refreshContentSnapshot({
  fetchImpl = fetch,
  env = process.env,
  kvClient = createKvClient({ fetchImpl, env }),
  now = new Date(),
  requireSnapshotPersist = false,
}) {
  const requestStartedAt = Date.now();
  const data = await fetchAllContentData({ fetchImpl, env });
  const fetchedAt = toIsoString(now);
  const snapshot = createSnapshotEnvelope(data, fetchedAt);
  const snapshotMetadata = createSnapshotMetadata(snapshot);
  let snapshotStored = false;

  if (kvClient) {
    try {
      await kvClient.setJson(SNAPSHOT_KEY, snapshot);
      await kvClient.setJson(SNAPSHOT_META_KEY, snapshotMetadata);
      snapshotStored = true;
    } catch (error) {
      if (requireSnapshotPersist) {
        throw error;
      }
    }
  } else if (requireSnapshotPersist) {
    throw new ContentError("KV is not configured.", {
      code: "KV_NOT_CONFIGURED",
      status: 500,
      failureType: "kv_not_configured",
    });
  }

  const response = {
    meta: createContentMeta({
      source: "live",
      degraded: false,
      fetchedAt,
      snapshotUpdatedAt: snapshotStored ? fetchedAt : null,
    }),
    data,
  };

  return {
    response,
    datasetCounts: snapshot.datasetCounts,
    notionLatencyMs: Date.now() - requestStartedAt,
    snapshotStored,
  };
}

export async function getContentResponse({
  fetchImpl = fetch,
  env = process.env,
  kvClient = createKvClient({ fetchImpl, env }),
  now = new Date(),
}) {
  const requestStartedAt = Date.now();

  try {
    const liveResult = await refreshContentSnapshot({
      fetchImpl,
      env,
      kvClient,
      now,
      requireSnapshotPersist: false,
    });

    return {
      response: liveResult.response,
      telemetry: {
        source: "live",
        failureType: null,
        notionLatencyMs: liveResult.notionLatencyMs,
        datasetCounts: liveResult.datasetCounts,
        snapshotAgeSeconds: liveResult.response.meta.snapshotAgeSeconds,
      },
    };
  } catch (error) {
    const snapshot = await readSnapshot({ kvClient });

    if (!snapshot) {
      const failureType =
        error instanceof ContentError
          ? error.failureType
          : "content_refresh_failed";

      throw new ContentError(
        "Live content refresh failed and no cached snapshot is available.",
        {
          code: "CONTENT_UNAVAILABLE",
          status: 503,
          failureType,
          details: {
            liveError:
              error instanceof ContentError
                ? error.details || error.message
                : error instanceof Error
                  ? error.message
                  : String(error),
          },
        },
      );
    }

    const fetchedAt = toIsoString(now);
    const response = {
      meta: createContentMeta({
        source: "snapshot",
        degraded: true,
        fetchedAt,
        snapshotUpdatedAt: snapshot.updatedAt,
      }),
      data: snapshot.data,
    };

    return {
      response,
      telemetry: {
        source: "snapshot",
        failureType:
          error instanceof ContentError
            ? error.failureType
            : "content_refresh_failed",
        notionLatencyMs: Date.now() - requestStartedAt,
        datasetCounts:
          snapshot.datasetCounts || createDatasetCounts(snapshot.data),
        snapshotAgeSeconds: response.meta.snapshotAgeSeconds,
      },
    };
  }
}

export async function getHealthSummary({
  fetchImpl = fetch,
  env = process.env,
  kvClient = createKvClient({ fetchImpl, env }),
  now = new Date(),
}) {
  const timestamp = toIsoString(now);

  if (!kvClient) {
    return {
      status: "failed",
      timestamp,
      environment: "vercel-serverless",
      snapshotExists: false,
      snapshotUpdatedAt: null,
      snapshotAgeSeconds: null,
      datasetCounts: null,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  const metadata = await readSnapshotMetadata({ kvClient });

  if (!metadata?.snapshotExists || !metadata.updatedAt) {
    return {
      status: "failed",
      timestamp,
      environment: "vercel-serverless",
      snapshotExists: false,
      snapshotUpdatedAt: null,
      snapshotAgeSeconds: null,
      datasetCounts: null,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  const snapshotAgeSeconds = getSnapshotAgeSeconds(
    metadata.updatedAt,
    timestamp,
  );
  let status = "ok";

  if (
    snapshotAgeSeconds === null ||
    snapshotAgeSeconds > HEALTH_FAILED_AFTER_SECONDS
  ) {
    status = "failed";
  } else if (snapshotAgeSeconds > HEALTH_DEGRADED_AFTER_SECONDS) {
    status = "degraded";
  }

  return {
    status,
    timestamp,
    environment: "vercel-serverless",
    snapshotExists: true,
    snapshotUpdatedAt: metadata.updatedAt,
    snapshotAgeSeconds,
    datasetCounts: metadata.datasetCounts || null,
    schemaVersion: metadata.schemaVersion || SCHEMA_VERSION,
  };
}

export function isAuthorizedCronRequest(req, env = process.env) {
  const secret = env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = req.headers.authorization;
  const headerSecret = req.headers["x-cron-secret"];

  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

export function buildStructuredLog(event, telemetry) {
  return JSON.stringify({
    event,
    ...telemetry,
  });
}

export function createErrorPayload(error) {
  if (error instanceof ContentError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        failureType: error.failureType,
      },
    };
  }

  return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        failureType: "internal_server_error",
      },
    };
}
