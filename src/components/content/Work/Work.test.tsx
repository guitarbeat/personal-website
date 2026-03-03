import { render } from "@testing-library/react";
import moment from "moment";

jest.mock("../../../components/effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="mock-pixel-canvas" />;
  };
});

import { NotionContext } from "../../../contexts/NotionContext";
import Work from "./Work";

jest.mock("react-db-google-sheets", () => ({
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
    const currentMonth = moment().format("MM-YYYY");

    const { container } = render(
      <NotionContext.Provider
        value={{
          db: {
            projects: [],
            about: [],
            work: [
              {
                title: "Senior Developer",
                company: "Acme Corp",
                place: "Remote",
                from: currentMonth,
                to: "",
                description: "Building resilient timelines.",
                slug: "senior-developer",
              },
            ],
          },
          loading: false,
          error: null,
        }}
      >
        <Work />
      </NotionContext.Provider>,
    );

    const timelineBar = container.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    expect((timelineBar as HTMLElement).style.height).toBe("100%");
    expect((timelineBar as HTMLElement).style.bottom).toBe("0%");
  });
});
