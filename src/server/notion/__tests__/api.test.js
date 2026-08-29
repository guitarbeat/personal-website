import { queryNotionDatabase } from "../index.mjs";
import {
  createProjectPage,
  createWorkPage,
  mockResponse,
} from "../testFixtures.mjs";

describe("notion api queries", () => {
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
                Name: { title: [{ plain_text: "Project One" }] },
                Date: { number: 2024 },
                Link: { url: "https://example.com/project-one" },
                Slug: { rich_text: [{ plain_text: "project-one" }] },
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
                rich_text: [{ plain_text: "Project One body content" }],
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

  it("throws ContentError with NOTION_REQUEST_FAILED when fetching block children fails", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            {
              id: "project-error-page",
              properties: {
                Name: { title: [{ plain_text: "Project Error" }] },
                Date: { number: 2024 },
                Link: { url: "https://example.com/project-error" },
                Slug: { rich_text: [{ plain_text: "project-error" }] },
                Published: { checkbox: true },
              },
            },
          ],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      queryNotionDatabase({
        databaseType: "projects",
        fetchImpl,
        env: { NOTION_TOKEN: "test-token" },
      }),
    ).rejects.toMatchObject({
      code: "NOTION_REQUEST_FAILED",
      failureType: "notion_request_failed",
      message: "Failed to reach Notion block API.",
      details: {
        blockId: "project-error-page",
        message: "Network Error",
      },
    });
  });

  it("throws ContentError with NOTION_REQUEST_FAILED when fetchImpl throws an error inside fetchNotionBlockChildren", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          results: [
            {
              id: "project-error-page",
              properties: {
                Name: { title: [{ plain_text: "Project Error" }] },
                Date: { number: 2024 },
                Link: { url: "https://example.com/project-error" },
                Slug: { rich_text: [{ plain_text: "project-error" }] },
                Published: { checkbox: true },
              },
            },
          ],
          has_more: false,
          next_cursor: null,
        }),
      )
      .mockImplementationOnce(() => Promise.reject(new Error("Network Error")));

    await expect(
      queryNotionDatabase({
        databaseType: "projects",
        fetchImpl,
        env: { NOTION_TOKEN: "test-token" },
      }),
    ).rejects.toMatchObject({
      code: "NOTION_REQUEST_FAILED",
      failureType: "notion_request_failed",
      message: "Failed to reach Notion block API.",
      details: {
        blockId: "project-error-page",
        message: "Network Error",
      },
    });
  });
  it("limits concurrent block fetching requests to concurrencyLimit", async () => {
    let activeRequests = 0;
    let maxActiveRequests = 0;

    const pages = Array.from({ length: 12 }, (_, i) => ({
      id: `page-${i}`,
      properties: {
        Name: { title: [{ plain_text: `Project ${i}` }] },
        Date: { number: 2024 },
        Link: { url: `https://example.com/project-${i}` },
        Slug: { rich_text: [{ plain_text: `project-${i}` }] },
        Published: { checkbox: true },
      },
    }));

    const fetchImpl = jest.fn().mockImplementation(async (url) => {
      if (url.includes("/databases/")) {
        return mockResponse({
          results: pages,
          has_more: false,
          next_cursor: null,
        });
      }
      if (url.includes("/blocks/")) {
        activeRequests++;
        if (activeRequests > maxActiveRequests) {
          maxActiveRequests = activeRequests;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeRequests--;
        return mockResponse({
          results: [
            {
              type: "paragraph",
              paragraph: {
                rich_text: [{ plain_text: `Body content` }],
              },
            },
          ],
          has_more: false,
          next_cursor: null,
        });
      }
      return mockResponse({});
    });

    const records = await queryNotionDatabase({
      databaseType: "projects",
      fetchImpl,
      env: { NOTION_TOKEN: "test-token" },
    });

    expect(records).toHaveLength(12);
    expect(maxActiveRequests).toBeLessThanOrEqual(5);
  });
});
