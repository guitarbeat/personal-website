import { render } from "@testing-library/react";
import moment from "moment";

import Work from "./Work";

jest.mock("../../effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="pixel-canvas" />;
  };
});

const mockCurrentMonth = moment().format("MM-YYYY");

jest.mock("../../../contexts/NotionContext", () => ({
  useNotion: () => ({
    work: [
      {
        title: "Senior Developer",
        company: "Acme Corp",
        place: "Remote",
        from: mockCurrentMonth,
        to: "",
        description: "Building resilient timelines.",
        slug: "senior-developer",
      },
    ],
    projects: [],
    about: [],
    loading: false,
    error: null,
  }),
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
    const { container } = render(
      <Work
        db={{
          work: [
            {
              title: "Senior Developer",
              company: "Acme Corp",
              place: "Remote",
              from: mockCurrentMonth,
              to: "",
              description: "Building resilient timelines.",
              slug: "senior-developer",
              // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
            } as any,
          ],
        }}
      />,
    );

    const timelineBar = container.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    expect((timelineBar as HTMLElement).style.height).toBe("100%");
    expect((timelineBar as HTMLElement).style.bottom).toBe("0%");
  });
});
