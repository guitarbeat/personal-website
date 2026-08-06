import { fetchAllContentData } from "./api.mjs";
import {
  ContentError,
  HEALTH_DEGRADED_AFTER_SECONDS,
  HEALTH_FAILED_AFTER_SECONDS,
  SCHEMA_VERSION,
  SNAPSHOT_KEY,
  SNAPSHOT_META_KEY,
} from "./constants.mjs";
import {
  getSnapshotAgeSeconds,
  parseJsonSafely,
  parseResponseJson,
  toIsoString,
} from "./helpers.mjs";
import { validateContentData } from "./validate.mjs";

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
      console.log("[Notion KV] Successfully updated snapshot.");
    } catch (error) {
      console.error("[Notion KV] Failed to update snapshot:", error);
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
