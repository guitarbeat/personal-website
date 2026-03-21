import { applyCors } from "../src/server/apiCors.js";
import {
  buildStructuredLog,
  CACHE_CONTROL_HEADER,
  createErrorPayload,
  queryNotionDatabase,
} from "../src/server/notionContent.js";

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: "GET, POST, OPTIONS",
  });

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
        failureType: "method_not_allowed",
      },
    });
  }

  const requestStartedAt = Date.now();

  try {
    const { database } = req.query;
    const records = await queryNotionDatabase({
      databaseType: String(database || "").toLowerCase(),
      requestBody: req.method === "POST" ? req.body : {},
      env: process.env,
    });

    if (req.method === "GET") {
      res.setHeader("Cache-Control", CACHE_CONTROL_HEADER);
    }

    console.log(
      buildStructuredLog("notion.dataset.request", {
        source: "live",
        failureType: null,
        notionLatencyMs: Date.now() - requestStartedAt,
        datasetCounts: {
          [String(database || "unknown")]: records.length,
        },
        snapshotAgeSeconds: null,
      }),
    );

    return res.status(200).json(records);
  } catch (error) {
    const payload = createErrorPayload(error);

    console.error(
      buildStructuredLog("notion.dataset.request", {
        source: "live",
        failureType: payload.error.failureType,
        notionLatencyMs: Date.now() - requestStartedAt,
        datasetCounts: null,
        snapshotAgeSeconds: null,
      }),
    );

    return res.status(error?.status || 500).json(payload);
  }
}
