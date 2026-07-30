import "@testing-library/jest-dom";
import { preloadLcpImage } from "../preloadLcpImage";

describe("preloadLcpImage", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("injects a high-priority image preload link", () => {
    preloadLcpImage("/assets/profile1-nbg.png");

    const link = document.head.querySelector('link[rel="preload"]');
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("as", "image");
    expect(link).toHaveAttribute("href", "/assets/profile1-nbg.png");
    expect(link).toHaveAttribute("fetchpriority", "high");
  });

  it("does not inject duplicate preload links", () => {
    preloadLcpImage("/assets/profile1-nbg.png");
    preloadLcpImage("/assets/profile1-nbg.png");

    expect(document.head.querySelectorAll('link[rel="preload"]')).toHaveLength(
      1,
    );
  });

  it("ignores empty href", () => {
    preloadLcpImage("");

    expect(document.head.querySelector('link[rel="preload"]')).toBeNull();
  });
});
