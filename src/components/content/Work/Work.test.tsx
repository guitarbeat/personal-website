import { act, render } from "@testing-library/react";
import moment from "moment";
import { NotionProvider } from "../../../contexts/NotionContext";
import Work from "./Work";

jest.mock("react-db-google-sheets", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: mocked component
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

    let container: HTMLElement | undefined = undefined;
    act(() => {
      const result = render(
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
      container = result.container;
    });

    const timelineBar = container!.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    expect((timelineBar as HTMLElement).style.height).toBe("100%");
    expect((timelineBar as HTMLElement).style.bottom).toBe("0%");
  });
});
