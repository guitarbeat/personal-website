import { render } from "@testing-library/react";
import Projects from "./Projects";

// Mock react-db-google-sheets
jest.mock("react-db-google-sheets", () => ({
  withGoogleSheets: () => (Component: any) => (props: any) => (
    <Component {...props} />
  ),
}));

// Mock NotionContext
const mockUseNotion = jest.fn();
jest.mock("../../../contexts/NotionContext", () => ({
  useNotion: () => mockUseNotion(),
}));

describe("Projects", () => {
  beforeEach(() => {
    mockUseNotion.mockReturnValue({
      db: { projects: [] },
      loading: false,
      error: null,
    });
  });

  it("renders without crashing", () => {
    render(<Projects />);
  });
});
