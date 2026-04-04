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
    db: {
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
    },
    meta: null,
    loading: false,
    error: null,
    isDegraded: false,
    lastUpdated: null,
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

  it("renders cards in the order provided by the API payload", () => {
    const { container } = render(
      <Work
        db={{
          work: [
            {
              title: "Current Role",
              company: "Beta Corp",
              place: "Austin, TX",
              from: "08-2021",
              to: "",
              description: "Most recent role.",
              slug: "current-role",
            },
            {
              title: "Older Role",
              company: "Acme Corp",
              place: "Remote",
              from: "01-2018",
              to: "05-2018",
              description: "Older role.",
              slug: "older-role",
              // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
            } as any,
          ],
        }}
      />,
    );

    const headings = Array.from(container.querySelectorAll(".work__item h2")).map(
      (heading) => heading.textContent,
    );

    expect(headings).toEqual(["Current Role", "Older Role"]);
  });
});
