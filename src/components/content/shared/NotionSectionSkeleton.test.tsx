import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import { NotionSectionSkeleton } from "./NotionSectionSkeleton";

describe("NotionSectionSkeleton", () => {
  it("renders about placeholders while content is loading", () => {
    const { container } = render(<NotionSectionSkeleton section="about" />);

    expect(container.querySelectorAll(".about-me__text--skeleton")).toHaveLength(3);
  });

  it("renders project filter placeholders", () => {
    const { container } = render(
      <NotionSectionSkeleton section="project-filters" />,
    );

    expect(container.querySelectorAll(".tag--skeleton")).toHaveLength(4);
  });

  it("renders project card placeholders", () => {
    const { container } = render(<NotionSectionSkeleton section="projects" />);

    expect(container.querySelectorAll(".projects__card--skeleton")).toHaveLength(
      4,
    );
  });

  it("renders work timeline and card placeholders", () => {
    const { container } = render(<NotionSectionSkeleton section="work" />);

    expect(container.querySelector(".work__timeline--skeleton")).toBeInTheDocument();
    expect(container.querySelectorAll(".work__item--skeleton")).toHaveLength(3);
  });
});
