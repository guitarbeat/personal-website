import { render, screen } from "@testing-library/react";

// Mock dependencies
jest.mock("react-db-google-sheets", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mocking HOC
  withGoogleSheets: () => (Component: any) => Component,
}));

describe("Work timeline", () => {
  beforeAll(() => {
    class IntersectionObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
  });

  it("renders a current-month job with a finite timeline", () => {
    // Mock the date to ensure consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-10-15"));

    const mockDb = {
      work: [
        {
          id: "1",
          company: "Test Corp",
          role: "Developer",
          location: "Remote",
          duration: "2022 - Present",
          description: ["Built things"],
          startDate: "2022-01-01",
          // No end date implies "Present"
        },
      ],
    };

    render(<Work db={mockDb} />);

    expect(screen.getByText("Test Corp")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();

    jest.useRealTimers();
  });
});
