import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generateItemColors } from "../../../utils/colorUtils";
import { NotionContext } from "../../../contexts/NotionContext";

jest.mock("../../../components/effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="mock-pixel-canvas" />;
  };
});

import Projects from "./Projects";

jest.mock("react-db-google-sheets", () => ({
  withGoogleSheets: () => (Component: any) => (props: any) => (
    <Component {...props} />
  ),
}));

jest.mock("../../../utils/colorUtils", () => {
  const actual = jest.requireActual("../../../utils/colorUtils");
  return {
    ...actual,
    generateItemColors: jest.fn() as jest.Mock,
  };
});

describe("Projects", () => {
  const MOCK_PROJECTS = [
    {
      title: "Project One",
      slug: "project-one",
      date: "2024",
      keyword: "React",
      link: "https://example.com/react",
      content: "React project",
      image: null,
    },
    {
      title: "Project Two",
      slug: "project-two",
      date: "2023",
      keyword: "Node",
      link: "https://example.com/node",
      content: "Node project",
      image: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("regenerates tag colors when the theme changes", async () => {
    (generateItemColors as jest.Mock)
      .mockImplementationOnce(() => ({
        React: "hsl(0, 0%, 50%)",
        Node: "hsl(120, 100%, 50%)",
      }))
      .mockImplementation(() => ({
        React: "hsl(200, 60%, 55%)",
        Node: "hsl(40, 80%, 60%)",
      }));

    render(<NotionContext.Provider value={{ db: { projects: MOCK_PROJECTS } as any, loading: false, error: null }}><Projects /></NotionContext.Provider>);

    const reactFilter = await screen.findByRole("button", { name: "React" });

    expect(generateItemColors).toHaveBeenCalledWith(MOCK_PROJECTS, "keyword");

    await waitFor(() => {
      expect(reactFilter).toBeInTheDocument();
    });

    act(() => {
      document.body.dispatchEvent(new CustomEvent("theme-changed"));
    });

    expect(generateItemColors).toHaveBeenCalledTimes(2);
    expect(generateItemColors).toHaveBeenLastCalledWith(
      MOCK_PROJECTS,
      "keyword",
    );

    await waitFor(() => {
      expect(reactFilter).toBeInTheDocument();
      expect(reactFilter).toHaveClass("active");
    });
  });

  it("filters projects by keyword and restores cards when toggling the last active filter", async () => {
    (generateItemColors as jest.Mock).mockReturnValue({
      React: "hsl(0, 0%, 50%)",
      Node: "hsl(120, 100%, 50%)",
    });

    const user = userEvent.setup();

    render(<NotionContext.Provider value={{ db: { projects: MOCK_PROJECTS } as any, loading: false, error: null }}><Projects /></NotionContext.Provider>);

    const reactFilter = await screen.findByRole("button", { name: "React" });
    const nodeFilter = await screen.findByRole("button", { name: "Node" });

    const reactProject = screen.getByRole("link", { name: /Project One/i });
    const nodeProject = screen.getByRole("link", { name: /Project Two/i });

    await user.click(reactFilter);

    await waitFor(() => {
      expect(reactFilter).not.toHaveClass("active");
      expect(nodeFilter).toHaveClass("active");
      expect(reactProject).toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });

    await user.click(nodeFilter);

    await waitFor(() => {
      expect(reactFilter).toHaveClass("active");
      expect(nodeFilter).toHaveClass("active");
      expect(reactProject).not.toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });

    await user.click(reactFilter);

    await waitFor(() => {
      expect(reactProject).toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });

    await user.click(nodeFilter);

    await waitFor(() => {
      expect(reactProject).not.toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });
  });
});
