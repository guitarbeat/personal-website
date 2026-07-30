import { ContentError } from "./constants.mjs";
import { isMonthYear } from "./helpers.mjs";

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
        } catch (error) {
          console.error("Failed to parse filter property:", error);
        }
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
