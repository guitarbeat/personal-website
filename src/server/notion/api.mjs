import {
  ContentError,
  DATABASE_IDS,
  NOTION_API_BASE,
  NOTION_VERSION,
} from "./constants.mjs";
import {
  extractBlockPlainText,
  extractRichText,
  getNotionToken,
  parseResponseJson,
} from "./helpers.mjs";
import {
  getDatasetTransformer,
  prepareProjectsForPublicDisplay,
  prepareWorkForPublicDisplay,
  transformProjectsData,
  transformWorkData,
} from "./transform.mjs";
import {
  validateContentData,
  validateDatasetRecords,
  validateQueryBody,
} from "./validate.mjs";

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


async function mapConcurrent(items, mapper, concurrency) {
  const results = new Array(items.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      try {
        results[index] = await mapper(items[index], index);
      } catch (error) {
        throw error;
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker
  );

  await Promise.all(workers);

  return results;
}

async function fetchProjectContentByPageId({
  pages,
  fetchImpl = fetch,
  notionToken,
}) {
  const contentEntries = await mapConcurrent(
    pages,
    async (page) => {
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
        .filter(
          (blockText) => typeof blockText === "string" && blockText.length,
        )
        .join("\n\n");

      return [page.id, pageContent];
    },
    10,
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
