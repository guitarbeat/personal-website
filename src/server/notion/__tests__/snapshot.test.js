import {
  getContentResponse,
  getHealthSummary,
  refreshContentSnapshot,
  SNAPSHOT_KEY,
  SNAPSHOT_META_KEY,
} from "../index.mjs";
import {
  createAboutPage,
  createProjectPage,
  createWorkPage,
  mockResponse,
  snapshotEnvelope,
} from "../testFixtures.mjs";

describe("notion snapshot and health", () => {
  it("writes the KV snapshot after a successful refresh", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [createAboutPage("Bio", "Hello world")],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            createProjectPage({
              titleText: "Project One",
              slug: "project-one",
            }),
          ],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [createWorkPage()],
          has_more: false,
          next_cursor: null,
        }),
      );
    const kvClient = {
      getJson: jest.fn(),
      setJson: jest.fn().mockResolvedValue(undefined),
    };

    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    const result = await refreshContentSnapshot({
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
      requireSnapshotPersist: true,
    });

    expect(result.response.meta.source).toBe("live");
    expect(result.response.meta.snapshotUpdatedAt).toBe(
      "2026-03-21T12:00:00.000Z",
    );
    expect(kvClient.setJson).toHaveBeenNthCalledWith(
      1,
      SNAPSHOT_KEY,
      expect.objectContaining({
        updatedAt: "2026-03-21T12:00:00.000Z",
        datasetCounts: {
          about: 1,
          projects: 1,
          work: 1,
        },
      }),
    );
    expect(kvClient.setJson).toHaveBeenNthCalledWith(
      2,
      SNAPSHOT_META_KEY,
      expect.objectContaining({
        snapshotExists: true,
        updatedAt: "2026-03-21T12:00:00.000Z",
      }),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[Notion KV] Successfully updated snapshot.",
    );

    consoleLogSpy.mockRestore();
  });

  it("throws an error when kvClient.setJson fails and requireSnapshotPersist is true", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [],
        has_more: false,
        next_cursor: null,
      }),
    );
    const mockError = new Error("KV write failed");
    const kvClient = {
      getJson: jest.fn(),
      setJson: jest.fn().mockRejectedValue(mockError),
    };

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(
      refreshContentSnapshot({
        fetchImpl,
        env: { NOTION_TOKEN: "test-token" },
        kvClient,
        now: new Date("2026-03-21T12:00:00.000Z"),
        requireSnapshotPersist: true,
      }),
    ).rejects.toThrow("KV write failed");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Notion KV] Failed to update snapshot:",
      mockError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("swallows the error and returns snapshotStored=false when kvClient.setJson fails and requireSnapshotPersist is false", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [],
        has_more: false,
        next_cursor: null,
      }),
    );
    const mockError = new Error("KV write failed");
    const kvClient = {
      getJson: jest.fn(),
      setJson: jest.fn().mockRejectedValue(mockError),
    };

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await refreshContentSnapshot({
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
      requireSnapshotPersist: false,
    });

    expect(result.snapshotStored).toBe(false);
    expect(result.response.meta.snapshotUpdatedAt).toBeNull();
    expect(result.response.meta.source).toBe("live");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Notion KV] Failed to update snapshot:",
      mockError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("returns the KV snapshot with degraded=true when live refresh fails", async () => {
    const kvClient = {
      getJson: jest.fn().mockResolvedValue(snapshotEnvelope),
      setJson: jest.fn(),
    };

    const result = await getContentResponse({
      fetchImpl: jest.fn().mockRejectedValue(new Error("network down")),
      env: { NOTION_TOKEN: "test-token" },
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
    });

    expect(result.response.meta).toMatchObject({
      source: "snapshot",
      degraded: true,
      snapshotUpdatedAt: "2026-03-21T10:00:00.000Z",
    });
    expect(result.response.data.projects[0].slug).toBe("snapshot-project");
  });

  it("returns 503 when both live refresh and snapshot fallback are unavailable", async () => {
    const kvClient = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn(),
    };

    await expect(
      getContentResponse({
        fetchImpl: jest.fn().mockRejectedValue(new Error("network down")),
        env: { NOTION_TOKEN: "test-token" },
        kvClient,
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "CONTENT_UNAVAILABLE",
    });
  });

  it("falls back to the previous snapshot when transformed live data is invalid", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [createAboutPage("Bio", "Hello world")],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            createProjectPage({
              titleText: "Project One",
              slug: "project-one",
            }),
          ],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            createWorkPage({
              from: "",
            }),
          ],
          has_more: false,
          next_cursor: null,
        }),
      );
    const kvClient = {
      getJson: jest.fn().mockResolvedValue(snapshotEnvelope),
      setJson: jest.fn(),
    };

    const result = await getContentResponse({
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
    });

    expect(result.response.meta.source).toBe("snapshot");
    expect(result.response.data.work[0].slug).toBe("snapshot-role");
  });

  it("reports degraded health when the snapshot is older than 30 minutes", async () => {
    const kvClient = {
      getJson: jest.fn().mockResolvedValue({
        snapshotExists: true,
        updatedAt: "2026-03-21T11:20:00.000Z",
        datasetCounts: snapshotEnvelope.datasetCounts,
        schemaVersion: 3,
      }),
      setJson: jest.fn(),
    };

    const summary = await getHealthSummary({
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
    });

    expect(summary.status).toBe("degraded");
    expect(summary.snapshotAgeSeconds).toBe(2400);
  });

  it("reports failed health when the snapshot is older than 24 hours", async () => {
    const kvClient = {
      getJson: jest.fn().mockResolvedValue({
        snapshotExists: true,
        updatedAt: "2026-03-20T10:00:00.000Z",
        datasetCounts: snapshotEnvelope.datasetCounts,
        schemaVersion: 3,
      }),
      setJson: jest.fn(),
    };

    const summary = await getHealthSummary({
      kvClient,
      now: new Date("2026-03-21T12:00:00.000Z"),
    });

    expect(summary.status).toBe("failed");
    expect(summary.snapshotAgeSeconds).toBe(93600);
  });
});
