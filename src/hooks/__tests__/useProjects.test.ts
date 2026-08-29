import { act, renderHook } from "@testing-library/react";
import { generateTagColors } from "@/utils/colorUtils";
import { useProjects } from "../useProjects";

jest.mock("@/contexts/NotionContext", () => ({
  useNotion: () => ({
    db: {
      projects: [
        {
          title: "Project One",
          slug: "project-one",
          date: "2024",
          keywords: ["React", "Data"],
          link: "https://example.com/react",
          hook: "React hook",
          detail: "React detail",
          image: null,
        },
      ],
    },
    loading: false,
  }),
}));

jest.mock("@/utils/colorUtils", () => {
  const actual = jest.requireActual("@/utils/colorUtils");
  return {
    ...actual,
    generateTagColors: jest.fn() as jest.Mock,
  };
});

describe("useProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts keywords, generates tag colors, and handles filter toggles", () => {
    (generateTagColors as jest.Mock).mockReturnValue({
      React: "hsl(0, 0%, 50%)",
      Data: "hsl(280, 50%, 50%)",
    });

    const mockProjects = [
      {
        title: "P1",
        slug: "p1",
        date: "2024",
        keywords: ["React", "Data"],
        link: null,
        hook: "Hook 1",
        detail: "Detail 1",
        image: null,
      },
      {
        title: "P2",
        slug: "p2",
        date: "2024",
        keywords: ["Node"],
        link: null,
        hook: "Hook 2",
        detail: "Detail 2",
        image: null,
      },
    ];

    const { result } = renderHook(() =>
      useProjects({ db: { projects: mockProjects } }),
    );

    expect(result.current.allKeywords).toEqual(["React", "Data", "Node"]);
    expect(result.current.projectsData).toBe(mockProjects);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.toggleFilter("React");
    });

    expect(result.current.activeFiltersSet.has("React")).toBe(false);
    expect(result.current.activeFiltersSet.has("Data")).toBe(true);
    expect(result.current.activeFiltersSet.has("Node")).toBe(true);
  });

  it("regenerates tag colors on theme-changed event", () => {
    (generateTagColors as jest.Mock).mockReturnValue({
      React: "hsl(0, 0%, 50%)",
    });

    renderHook(() =>
      useProjects({
        db: {
          projects: [
            {
              title: "P1",
              slug: "p1",
              date: "2024",
              keywords: ["React"],
              link: null,
              hook: "Hook 1",
              detail: "Detail 1",
              image: null,
            },
          ],
        },
      }),
    );

    expect(generateTagColors).toHaveBeenCalledWith(["React"]);

    act(() => {
      document.body.dispatchEvent(new CustomEvent("theme-changed"));
    });

    expect(generateTagColors).toHaveBeenCalledTimes(2);
  });
});
