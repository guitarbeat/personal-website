import { applyCors } from "../src/server/apiCors.js";
import { createErrorPayload, getHealthSummary } from "../src/server/notionContent.js";

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: "GET, OPTIONS",
  });

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
        failureType: "method_not_allowed",
      },
    });
  }

  try {
    const summary = await getHealthSummary({
      env: process.env,
    });
    const statusCode = summary.status === "failed" ? 503 : 200;

    res.setHeader("Cache-Control", "no-store");
    return res.status(statusCode).json(summary);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(error?.status || 500).json(createErrorPayload(error));
  }
}
