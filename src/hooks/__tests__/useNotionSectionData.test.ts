import { renderHook } from "@testing-library/react";
import { useNotion } from "../../contexts/NotionContext";
import type { NotionData } from "../../types/content";
import { useNotionSectionData } from "../useNotionSectionData";

jest.mock("../../contexts/NotionContext", () => ({
  useNotion: jest.fn(),
}));

const mockUseNotion = useNotion as jest.Mock;

describe("useNotionSectionData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns context db and isLoading = true when loading is true and propsDb is undefined", () => {
    const mockDb: NotionData = { projects: [], work: [], about: [] };
    mockUseNotion.mockReturnValue({
      db: mockDb,
      loading: true,
    });

    const { result } = renderHook(() => useNotionSectionData());

    expect(result.current.db).toBe(mockDb);
    expect(result.current.isLoading).toBe(true);
  });

  it("returns context db and isLoading = false when loading is false and propsDb is undefined", () => {
    const mockDb: NotionData = { projects: [], work: [], about: [] };
    mockUseNotion.mockReturnValue({
      db: mockDb,
      loading: false,
    });

    const { result } = renderHook(() => useNotionSectionData());

    expect(result.current.db).toBe(mockDb);
    expect(result.current.isLoading).toBe(false);
  });

  it("overrides context db with propsDb and sets isLoading = false even when context is loading", () => {
    const contextDb: NotionData = { projects: [], work: [], about: [] };
    const customDb: Partial<NotionData> = {
      projects: [
        {
          title: "Custom Project",
          slug: "custom-project",
          date: "2024",
          keywords: ["React"],
          link: null,
          hook: "Hook",
          detail: "Detail",
          image: null,
        },
      ],
    };

    mockUseNotion.mockReturnValue({
      db: contextDb,
      loading: true,
    });

    const { result } = renderHook(() => useNotionSectionData(customDb));

    expect(result.current.db).toBe(customDb);
    expect(result.current.isLoading).toBe(false);
  });

  it("uses propsDb when provided even if context is not loading", () => {
    const contextDb: NotionData = { projects: [], work: [], about: [] };
    const customDb: Partial<NotionData> = { work: [] };

    mockUseNotion.mockReturnValue({
      db: contextDb,
      loading: false,
    });

    const { result } = renderHook(() => useNotionSectionData(customDb));

    expect(result.current.db).toBe(customDb);
    expect(result.current.isLoading).toBe(false);
  });
});
