import { render, screen } from "@testing-library/react";
import Projects from "./Projects";

// Mock dependencies
jest.mock("react-db-google-sheets", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mocking HOC
  withGoogleSheets: () => (Component: any) => (props: any) => (
    <Component {...props} />
  ),
}));

describe("Projects", () => {
  it("renders projects from props", () => {
    const mockDb = {
      projects: [
        {
          id: "1",
          name: "Project Alpha",
          description: "A cool project",
          technologies: ["React", "TypeScript"],
          url: "https://example.com",
        },
      ],
    };

    render(<Projects db={mockDb} />);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("A cool project")).toBeInTheDocument();
  });
});
