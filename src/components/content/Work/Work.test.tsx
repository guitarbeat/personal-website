import { render } from "@testing-library/react";
import moment from "moment";

import Work from "./Work";

jest.mock("../../../contexts/NotionContext", () => ({
  useNotion: () => ({
    getProjects: () => [],
    getWork: () => MOCK_JOBS,
    db: {
      projects: [],
      work: MOCK_JOBS,
    },
    isLoading: false,
    error: null,
  }),
}));

const MOCK_JOBS = [
  {
    slug: "current-job",
    title: "Software Engineer",
    company: "Tech Corp",
    place: "Remote",
    from: "2024-01-01",
    to: "Present",
    type: "Full-time",
  },
];

jest.mock("../../effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="pixel-canvas-mock" />;
  };
});

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
      />,
    );

    const timelineBar = container.querySelector(".work__timeline__subbar");

    expect(timelineBar).not.toBeNull();
    expect((timelineBar as HTMLElement).style.height).toBe("100%");
    expect((timelineBar as HTMLElement).style.bottom).toBe("0%");
  });
});
