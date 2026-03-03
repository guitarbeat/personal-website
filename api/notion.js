// Vercel Serverless Function for Notion API proxy
// This replaces the Express server and runs on Vercel's edge network

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// Database IDs
const DATABASE_IDS = {
  projects: "29dda682bcf6806eaa2efe20631dab6c",
  work: "b589d1ef5ef64b35abcc88558bf5574f",
  about: "aab0a96e279d48b6833f6727e6301266",
};

// Helper function to extract rich text
function extractRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return "";
  return richTextArray.map((item) => item.plain_text || "").join("");
}

// Helper function to convert YYYY-MM-DD to MM-YYYY
function convertToMMYYYY(dateString) {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  return `${parts[1]}-${parts[0]}`;
}

// Transform Projects data
function transformProjectsData(results) {
  return results.map((page) => {
    const props = page.properties;
    return {
      title:
        props.title?.title?.[0]?.plain_text ||
        props.Name?.title?.[0]?.plain_text ||
        "",
      content: extractRichText(
        props.content?.rich_text || props.Description?.rich_text || [],
      ),
      date: props.date?.number || props.Date?.number || null,
      link: props.link?.url || props.Link?.url || null,
      slug:
        extractRichText(props.slug?.rich_text || props.Slug?.rich_text || []) ||
        page.id,
      image: extractRichText(
        props.image?.rich_text || props.Image?.rich_text || [],
      ),
      keyword:
        props.Keyword?.multi_select?.[0]?.name ||
        props.keyword?.multi_select?.[0]?.name ||
        "",
    };
  });
}

// Transform Work data
function transformWorkData(results) {
  return results.map((page) => {
    const props = page.properties;
    const fromDate = props.From?.date?.start || "";
    const toDate = props.To?.date?.start || "";

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

// Transform About data
function transformAboutData(results) {
  return results.map((page) => {
    const props = page.properties;
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

// Validate sorts array
function validateSorts(sorts) {
  if (!Array.isArray(sorts)) return undefined;
  return sorts.map((sort) => {
    if (!sort || typeof sort !== "object") return null;
    const { property, timestamp, direction } = sort;

    // Only allow 'ascending' or 'descending'
    if (direction !== "ascending" && direction !== "descending") return null;

    const newSort = { direction };

    if (typeof property === "string") {
      newSort.property = property;
    } else if (timestamp === "created_time" || timestamp === "last_edited_time") {
      newSort.timestamp = timestamp;
    } else {
      return null;
    }
    return newSort;
  }).filter(Boolean);
}

// Allowed filter types (Notion API v1)
const ALLOWED_FILTER_TYPES = [
  "title", "rich_text", "url", "email", "phone_number", "number",
  "checkbox", "select", "multi_select", "status", "date", "people",
  "files", "relation"
];

// Validate filter object (recursive with depth limit)
function validateFilter(filter, depth = 0) {
  if (depth > 2) return null; // Prevent deep nesting/DoS
  if (!filter || typeof filter !== "object") return null;

  // Handle compound filters
  if (Array.isArray(filter.and)) {
    const validAnd = filter.and.map((f) => validateFilter(f, depth + 1)).filter(Boolean);
    return validAnd.length > 0 ? { and: validAnd } : null;
  }
  if (Array.isArray(filter.or)) {
    const validOr = filter.or.map((f) => validateFilter(f, depth + 1)).filter(Boolean);
    return validOr.length > 0 ? { or: validOr } : null;
  }

  // Handle property filters
  if (typeof filter.property === "string") {
    const newFilter = { property: filter.property };
    let hasType = false;

    for (const key of Object.keys(filter)) {
      if (ALLOWED_FILTER_TYPES.includes(key) && filter[key] && typeof filter[key] === "object") {
         // Deep copy the condition object to prevent prototype pollution or weird getters
         try {
           newFilter[key] = structuredClone(filter[key]);
           hasType = true;
         } catch (e) {
           continue;
         }
      }
    }

    return hasType ? newFilter : null;
  }

  // Also support timestamp filters (created_time, last_edited_time)
  if (filter.timestamp === "created_time" || filter.timestamp === "last_edited_time") {
      const newFilter = { timestamp: filter.timestamp };
      if (filter.created_time && typeof filter.created_time === "object") {
          try {
              newFilter.created_time = structuredClone(filter.created_time);
              return newFilter;
          } catch (e) { return null; }
      }
      if (filter.last_edited_time && typeof filter.last_edited_time === "object") {
          try {
              newFilter.last_edited_time = structuredClone(filter.last_edited_time);
              return newFilter;
          } catch (e) { return null; }
      }
  }

  return null;
}

// Validate and sanitize the request body
function validateQueryBody(body) {
  if (!body || typeof body !== "object") return { page_size: 100 };
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

// CORS origin whitelist
const ALLOWED_ORIGINS = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

export default async function handler(req, res) {
  // Enable CORS with origin whitelist
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET and POST requests
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set Cache-Control header for GET requests
  // Cache for 1 hour (3600s), allow stale for another 24 hours (86400s)
  if (req.method === "GET") {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
  }

  try {
    // Extract database type from query parameter
    const { database } = req.query;

    if (!database) {
      return res.status(400).json({ error: "Database type is required" });
    }

    const databaseId = DATABASE_IDS[database.toLowerCase()];

    if (!databaseId) {
      return res.status(400).json({
        error: "Invalid database type",
        validTypes: Object.keys(DATABASE_IDS),
      });
    }

    // Get Notion token from environment variable
    const notionToken = process.env.REACT_APP_NOTION_TOKEN;

    if (!notionToken) {
      return res.status(500).json({ error: "Notion token not configured" });
    }

    // Query Notion database
    const response = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validateQueryBody(req.body)),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API error:", data);
      return res
        .status(response.status)
        .json({ error: "Notion API request failed" });
    }

    // Transform the data based on database type
    let transformedData;
    const results = data.results || [];

    switch (database.toLowerCase()) {
      case "projects":
        transformedData = transformProjectsData(results);
        break;
      case "work":
        transformedData = transformWorkData(results);
        break;
      case "about":
        transformedData = transformAboutData(results);
        break;
      default:
        transformedData = results;
    }

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error("[Notion API] ERROR:", error.message, error.stack);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
