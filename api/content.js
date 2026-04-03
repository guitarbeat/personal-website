import { applyCors } from "../src/server/apiCors.js";
import {
  buildStructuredLog,
  CACHE_CONTROL_HEADER,
  createErrorPayload,
  getContentResponse,
} from "../src/server/notionContent.js";

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
    const { response, telemetry } = await getContentResponse({
      env: process.env,
    });

    res.setHeader("Cache-Control", CACHE_CONTROL_HEADER);
    console.log(buildStructuredLog("content.request", telemetry));

    return res.status(200).json(response);
  } catch (error) {
    const payload = createErrorPayload(error);

    res.setHeader("Cache-Control", "no-store");
    console.error(
      buildStructuredLog("content.request", {
        source: "none",
        failureType: payload.error.failureType,
        notionLatencyMs: null,
        datasetCounts: null,
        snapshotAgeSeconds: null,
      }),
    );
    console.error(error);

    return res.status(error?.status || 500).json(payload);
  }
}
