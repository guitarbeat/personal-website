import {
  createErrorPayload,
  getContentResponse,
  getHealthSummary,
  isAuthorizedCronRequest,
  queryNotionDatabase,
  refreshContentSnapshot,
  SNAPSHOT_KEY,
  SNAPSHOT_META_KEY,
} from "./notionContent";

const mockResponse = (payload, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => payload,
});

const title = (text) => [{ plain_text: text }];
const richText = (text) => [{ plain_text: text }];

const createAboutPage = (category, description) => ({
  id: `${category.toLowerCase()}-page`,
  properties: {
    Category: { title: title(category) },
    Description: { rich_text: richText(description) },
  },
});

const createProjectPage = ({
  titleText,
  slug,
  keywords = ["React"],
  hook = `${titleText} hook`,
  detail = `${titleText} detail`,
  published = true,
  sortOrder = null,
  date = 2024,
} = {}) => ({
  id: `${slug}-page`,
  properties: {
    Name: { title: title(titleText) },
    Hook: { rich_text: hook ? richText(hook) : [] },
    Detail: { rich_text: detail ? richText(detail) : [] },
    Date: { number: date },
    Link: { url: `https://example.com/${slug}` },
    Slug: { rich_text: richText(slug) },
    Published: { checkbox: published },
    "Sort Order": { number: sortOrder },
    Keyword: {
      multi_select: keywords.map((keyword) => ({
        name: keyword,
      })),
    },
  },
});

const createWorkPage = ({
  titleText = "Engineer",
  slug = "engineer",
  from = "2024-01-01",
  to = "2024-06-01",
} = {}) => ({
  id: `${slug}-page`,
  properties: {
    Title: { title: title(titleText) },
    Company: { rich_text: richText("Acme Corp") },
    Description: { rich_text: richText("Building resilient systems.") },
    From: { date: { start: from } },
    To: { date: to ? { start: to } : null },
    Place: { rich_text: richText("Remote") },
    Slug: { rich_text: richText(slug) },
  },
});

const snapshotEnvelope = {
  schemaVersion: 3,
  updatedAt: "2026-03-21T10:00:00.000Z",
  datasetCounts: {
    about: 1,
    projects: 1,
    work: 1,
  },
  data: {
    about: [{ category: "Bio", description: "Hello" }],
    projects: [
      {
        title: "Snapshot Project",
        hook: "Cached hook",
        detail: "Cached detail",
        date: 2024,
        link: "https://example.com/snapshot-project",
        slug: "snapshot-project",
        image: null,
        keywords: ["Cached"],
      },
    ],
    work: [
      {
        title: "Snapshot Role",
        company: "Cached Corp",
        description: "Cached timeline entry",
        from: "01-2024",
        to: "06-2024",
        place: "Remote",
        slug: "snapshot-role",
      },
    ],
  },
};

describe("notionContent server helpers", () => {
  it("paginates through multi-page Notion responses and returns all records", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            createProjectPage({
              titleText: "Project One",
              slug: "project-one",
            }),
          ],
          has_more: true,
          next_cursor: "cursor-1",
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            createProjectPage({
              titleText: "Project Two",
              slug: "project-two",
              keywords: ["Node"],
            }),
          ],
          has_more: false,
          next_cursor: null,
        }),
      );

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toMatchObject({
      start_cursor: "cursor-1",
    });
  });

  it("returns every selected Notion project keyword", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [
          createProjectPage({
            titleText: "Project One",
            slug: "project-one",
            keywords: ["React", "Data"],
          }),
        ],
        has_more: false,
        next_cursor: null,
      }),
    );

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records[0].keywords).toEqual(["React", "Data"]);
  });

  it("falls back to page body content when the project detail is stored in blocks", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            {
              id: "project-one-page",
              properties: {
                Name: { title: title("Project One") },
                Date: { number: 2024 },
                Link: { url: "https://example.com/project-one" },
                Slug: { rich_text: richText("project-one") },
                Published: { checkbox: true },
                Keyword: { multi_select: [{ name: "React" }] },
              },
            },
          ],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            {
              type: "paragraph",
              paragraph: {
                rich_text: richText("Project One body content"),
              },
            },
          ],
          has_more: false,
          next_cursor: null,
        }),
      );

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records[0].hook).toBe("Project One body content");
    expect(records[0].detail).toBe("Project One body content");
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/blocks/project-one-page/children"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("filters unpublished projects and sorts by sort order before date", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [
          createProjectPage({
            titleText: "Zeta Project",
            slug: "zeta-project",
            sortOrder: null,
            date: 2022,
          }),
          createProjectPage({
            titleText: "Alpha Project",
            slug: "alpha-project",
            sortOrder: 20,
            date: 2020,
          }),
          createProjectPage({
            titleText: "Beta Project",
            slug: "beta-project",
            sortOrder: 10,
            date: 2026,
          }),
          createProjectPage({
            titleText: "Hidden Project",
            slug: "hidden-project",
            published: false,
            sortOrder: 1,
          }),
        ],
        has_more: false,
        next_cursor: null,
      }),
    );

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records.map((record) => record.slug)).toEqual([
      "beta-project",
      "alpha-project",
      "zeta-project",
    ]);
  });

  it("sorts work records with current roles first, then by end date", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [
          createWorkPage({
            titleText: "Older Role",
            slug: "older-role",
            from: "2018-01-01",
            to: "2018-05-01",
          }),
          createWorkPage({
            titleText: "Current Role",
            slug: "current-role",
            from: "2021-08-01",
            to: null,
          }),
          createWorkPage({
            titleText: "Recent Role",
            slug: "recent-role",
            from: "2023-05-01",
            to: "2023-11-01",
          }),
          createWorkPage({
            titleText: "Earlier Current Role",
            slug: "earlier-current-role",
            from: "2020-01-01",
            to: null,
          }),
        ],
        has_more: false,
        next_cursor: null,
      }),
    );

    const records = await queryNotionDatabase({
      databaseType: "work",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records.map((record) => record.slug)).toEqual([
      "current-role",
      "earlier-current-role",
      "recent-role",
      "older-role",
    ]);
  });

  it("falls back to the project detail when the hook is missing", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      mockResponse({
        results: [
          createProjectPage({
            titleText: "Project One",
            slug: "project-one",
            hook: "",
            detail: "Project One detail",
          }),
        ],
        has_more: false,
        next_cursor: null,
      }),
    );

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records[0]).toMatchObject({
      hook: "Project One detail",
      detail: "Project One detail",
    });
  });

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

  it("accepts only header-based cron authorization", () => {
    expect(
      isAuthorizedCronRequest(
        {
          headers: {
            authorization: "Bearer top-secret",
          },
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        {
          headers: {
            "x-cron-secret": "top-secret",
          },
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        {
          headers: {},
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(false);
  });

  it("sanitizes public error payloads", () => {
    const payload = createErrorPayload(
      new Error("upstream details should stay private"),
    );

    expect(payload).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        failureType: "internal_server_error",
      },
    });
  });
});
