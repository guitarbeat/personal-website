import { render } from "@testing-library/react";
import moment from "moment";
import Work from "./Work";

// Mock react-db-google-sheets
jest.mock("react-db-google-sheets", () => ({
  withGoogleSheets: () => (Component: any) => Component,
}));

// Mock NotionContext
const mockUseNotion = jest.fn();
jest.mock("../../../contexts/NotionContext", () => ({
  useNotion: () => mockUseNotion(),
}));

describe("Work timeline", () => {
  beforeEach(() => {
    // Default mock implementation
    mockUseNotion.mockReturnValue({
      db: { work: [] },
      loading: false,
      error: null,
    });
  });

  beforeAll(() => {
    // IntersectionObserver is mocked in setupTests.ts usually, but keeping this for safety if setupTests isn't picked up by Craco immediately
    if (!global.IntersectionObserver) {
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
    }
  });

  it("renders a current-month job with a finite timeline", () => {
    const currentMonth = moment().format("MM-YYYY");
    const workData = [
      {
        title: "Senior Developer",
        company: "Acme Corp",
        place: "Remote",
        from: currentMonth,
        to: "",
        description: "Building resilient timelines.",
        slug: "senior-developer",
      },
    ];

    // Override mock for this test
    mockUseNotion.mockReturnValue({
      db: { work: workData },
      loading: false,
      error: null,
    });

    const { container } = render(
      <Work
        db={{
          work: workData,
        }}
      />,
    );

    const timelineBar = container.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    // Use type assertion or optional chaining to avoid TS errors in test if any
    expect((timelineBar as HTMLElement)?.style.height).toBe("100%");
    expect((timelineBar as HTMLElement)?.style.bottom).toBe("0%");
  });
});
