import "@testing-library/jest-dom";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generateTagColors } from "../../../utils/colorUtils";
import Projects from "./Projects";

jest.mock("../../effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="pixel-canvas" />;
  };
});

jest.mock("../../../contexts/NotionContext", () => ({
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
        {
          title: "Project Two",
          slug: "project-two",
          date: "2023",
          keywords: ["Node"],
          link: "https://example.com/node",
          hook: "Node hook",
          detail: "Node detail",
          image: null,
        },
      ],
      work: [],
      about: [],
    },
    meta: null,
    loading: false,
    error: null,
    isDegraded: false,
    lastUpdated: null,
  }),
}));

jest.mock("../../../utils/colorUtils", () => {
  const actual = jest.requireActual("../../../utils/colorUtils");
  return {
    ...actual,
    generateTagColors: jest.fn() as jest.Mock,
  };
});

describe("Projects", () => {
  const MOCK_PROJECTS = [
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
    {
      title: "Project Two",
      slug: "project-two",
      date: "2023",
      keywords: ["Node"],
      link: "https://example.com/node",
      hook: "Node hook",
      detail: "Node detail",
      image: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("regenerates tag colors when the theme changes", async () => {
    (generateTagColors as jest.Mock)
      .mockImplementationOnce(() => ({
        React: "hsl(0, 0%, 50%)",
        Data: "hsl(280, 50%, 50%)",
        Node: "hsl(120, 100%, 50%)",
      }))
      .mockImplementation(() => ({
        React: "hsl(200, 60%, 55%)",
        Data: "hsl(260, 50%, 60%)",
        Node: "hsl(40, 80%, 60%)",
      }));

    render(<Projects db={{ projects: MOCK_PROJECTS }} />);

    const reactFilter = await screen.findByRole("button", { name: "React" });

    expect(generateTagColors).toHaveBeenCalledWith(["React", "Data", "Node"]);

    await waitFor(() => {
      expect(reactFilter).toHaveStyle({
        "--tag-color": "hsl(0, 0%, 50%)",
      });
    });

    act(() => {
      document.body.dispatchEvent(new CustomEvent("theme-changed"));
    });

    expect(generateTagColors).toHaveBeenCalledTimes(2);
    expect(generateTagColors).toHaveBeenLastCalledWith([
      "React",
      "Data",
      "Node",
    ]);

    await waitFor(() => {
      expect(reactFilter).toHaveStyle({
        "--tag-color": "hsl(200, 60%, 55%)",
      });
      expect(reactFilter).toHaveClass("active");
    });
  });

  it("renders project hooks immediately and reveals detail on click", async () => {
    (generateTagColors as jest.Mock).mockReturnValue({
      React: "hsl(0, 0%, 50%)",
      Data: "hsl(280, 50%, 50%)",
      Node: "hsl(120, 100%, 50%)",
    });

    const user = userEvent.setup();

    render(<Projects db={{ projects: MOCK_PROJECTS }} />);

    const projectCard = await screen.findByRole("link", { name: /Project One/i });

    expect(within(projectCard).getByText("React hook")).toBeInTheDocument();

    const detail = within(projectCard).getByText("React detail");
    expect(detail).not.toHaveClass("show-text");

    await user.click(projectCard);

    await waitFor(() => {
      expect(detail).toHaveClass("show-text");
    });
  });

  it("renders multiple project tags and filters by any active keyword", async () => {
    (generateTagColors as jest.Mock).mockReturnValue({
      React: "hsl(0, 0%, 50%)",
      Data: "hsl(280, 50%, 50%)",
      Node: "hsl(120, 100%, 50%)",
    });

    const user = userEvent.setup();

    render(<Projects db={{ projects: MOCK_PROJECTS }} />);

    const reactFilter = await screen.findByRole("button", { name: "React" });
    const dataFilter = await screen.findByRole("button", { name: "Data" });
    const nodeFilter = await screen.findByRole("button", { name: "Node" });

    const reactProject = screen.getByRole("link", { name: /Project One/i });
    const nodeProject = screen.getByRole("link", { name: /Project Two/i });

    expect(within(reactProject).getByText("React")).toBeInTheDocument();
    expect(within(reactProject).getByText("Data")).toBeInTheDocument();

    await user.click(reactFilter);

    await waitFor(() => {
      expect(reactFilter).not.toHaveClass("active");
      expect(dataFilter).toHaveClass("active");
      expect(nodeFilter).toHaveClass("active");
      expect(reactProject).not.toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });

    await user.click(dataFilter);

    await waitFor(() => {
      expect(reactFilter).not.toHaveClass("active");
      expect(dataFilter).not.toHaveClass("active");
      expect(nodeFilter).toHaveClass("active");
      expect(reactProject).toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });

    await user.click(nodeFilter);

    await waitFor(() => {
      expect(reactFilter).toHaveClass("active");
      expect(dataFilter).toHaveClass("active");
      expect(nodeFilter).toHaveClass("active");
      expect(reactProject).not.toHaveClass("filtered-out");
      expect(nodeProject).not.toHaveClass("filtered-out");
    });
  });
});
