import "@testing-library/jest-dom";
import { render, renderHook, screen, waitFor } from "@testing-library/react";

import { NotionProvider, useNotion } from "./NotionContext";

const mockGetAllData = jest.fn();

jest.mock("../services/notionService", () => {
  class MockNotionService {
    getAllData = mockGetAllData;
  }

  return {
    __esModule: true,
    default: MockNotionService,
  };
});

const Consumer = () => {
  const notion = useNotion();

  return (
    <div>
      <p>{notion.isDegraded ? "degraded" : "live"}</p>
      <p>{notion.lastUpdated || "no-last-updated"}</p>
      <p>{notion.db.projects[0]?.title || "no-projects"}</p>
      <p>{notion.error || "no-error"}</p>
      <p>{notion.loading ? "loading" : "not-loading"}</p>
    </div>
  );
};

describe("NotionProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores metadata and exposes degraded state from /api/content", async () => {
    mockGetAllData.mockResolvedValue({
      meta: {
        source: "snapshot",
        degraded: true,
        fetchedAt: "2026-03-21T12:00:00.000Z",
        snapshotUpdatedAt: "2026-03-21T10:00:00.000Z",
        snapshotAgeSeconds: 7200,
        schemaVersion: 3,
      },
      data: {
        about: [],
        projects: [
          {
            title: "Project One",
            hook: "Cached hook",
            detail: "Cached detail",
            date: 2024,
            link: "https://example.com/project-one",
            slug: "project-one",
            image: null,
            keywords: ["Cached"],
          },
        ],
        work: [],
      },
    });

    render(
      <NotionProvider>
        <Consumer />
      </NotionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("degraded")).toBeInTheDocument();
      expect(screen.getByText("2026-03-21T10:00:00.000Z")).toBeInTheDocument();
      expect(screen.getByText("Project One")).toBeInTheDocument();
      expect(screen.getByText("not-loading")).toBeInTheDocument();
    });
  });

  it("handles errors when fetching data fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const errorMessage = "Network Error";
    mockGetAllData.mockRejectedValue(new Error(errorMessage));

    render(
      <NotionProvider>
        <Consumer />
      </NotionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("not-loading")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText("no-projects")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("throws an error if useNotion is used outside NotionProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => renderHook(() => useNotion())).toThrow(
      "useNotion must be used within NotionProvider",
    );
    consoleSpy.mockRestore();
  });
});
