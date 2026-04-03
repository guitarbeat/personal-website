import { applyCors } from "../src/server/apiCors.js";

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

  res.setHeader("Cache-Control", "no-store");

  return res.status(410).json({
    error: {
      code: "ENDPOINT_RETIRED",
      message: "The /api/notion endpoint has been retired. Use /api/content instead.",
      failureType: "endpoint_retired",
    },
  });
}
