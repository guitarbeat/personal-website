import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

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
    });
  });
});
