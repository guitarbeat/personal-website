export function parseJsonSafely(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

export function toIsoString(now = new Date()) {
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
export function getNotionToken(env = process.env) {
  return env.NOTION_TOKEN || env.REACT_APP_NOTION_TOKEN || "";
}

export function extractRichText(richTextArray) {
  if (!Array.isArray(richTextArray)) {
    return "";
  }

  return richTextArray.map((item) => item?.plain_text || "").join("");
}

export function extractFileUrl(fileList) {
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

export function extractMultiSelectNames(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => option?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

export function extractCheckboxValue(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate?.checkbox === "boolean") {
      return candidate.checkbox;
    }
  }

  return null;
}

export function extractNumberValue(...candidates) {
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

export function extractProjectHook(rawHook, detail, title) {
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

export function compareProjectRecords(a, b) {
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

export function isMonthYear(value) {
  return typeof value === "string" && /^\d{2}-\d{4}$/.test(value);
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

export function compareWorkRecords(a, b) {
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

export function convertToMMYYYY(dateString) {
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

export function extractBlockPlainText(block) {
  if (!block || typeof block !== "object") {
    return "";
  }

  const blockType = typeof block.type === "string" ? block.type : "";

  if (!TEXT_BLOCK_TYPES.includes(blockType)) {
    return "";
  }

  return extractRichText(block[blockType]?.rich_text || []);
}
