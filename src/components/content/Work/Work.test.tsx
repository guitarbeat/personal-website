import { render } from "@testing-library/react";
import moment from "moment";
import { NotionProvider } from "../../../contexts/NotionContext";
import Work from "./Work";

jest.mock("react-db-google-sheets", () => ({
  withGoogleSheets: () => (Component: any) => (props: any) => (
    <Component {...props} />
  ),
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
      <NotionProvider>
        <Work
          db={{
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
          }}
        />
      </NotionProvider>,
    );

    const timelineBar = container.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    expect((timelineBar as HTMLElement).style.height).toBe("100%");
    expect((timelineBar as HTMLElement).style.bottom).toBe("0%");
  });
});
