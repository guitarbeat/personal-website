import {
  buildStructuredLog,
  createErrorPayload,
  isAuthorizedCronRequest,
  refreshContentSnapshot,
} from "../src/server/notionContent.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
        failureType: "method_not_allowed",
      },
    });
  }

  if (!isAuthorizedCronRequest(req, process.env)) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        failureType: "unauthorized",
      },
    });
  }

  try {
    const result = await refreshContentSnapshot({
      env: process.env,
      requireSnapshotPersist: true,
    });

    res.setHeader("Cache-Control", "no-store");
    console.log(
      buildStructuredLog("content.refresh", {
        source: "live",
        failureType: null,
        notionLatencyMs: result.notionLatencyMs,
        datasetCounts: result.datasetCounts,
        snapshotAgeSeconds: result.response.meta.snapshotAgeSeconds,
      }),
    );

    return res.status(200).json({
      ok: true,
      meta: result.response.meta,
      datasetCounts: result.datasetCounts,
      snapshotStored: result.snapshotStored,
    });
  } catch (error) {
    const payload = createErrorPayload(error);

    res.setHeader("Cache-Control", "no-store");
    console.error(
      buildStructuredLog("content.refresh", {
        source: "live",
        failureType: payload.error.failureType,
        notionLatencyMs: null,
        datasetCounts: null,
        snapshotAgeSeconds: null,
      }),
    );

    return res.status(error?.status || 500).json(payload);
  }
}
