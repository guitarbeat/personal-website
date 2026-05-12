import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import InfiniteScrollEffect from "./InfiniteScrollEffect";

// Mock resize observer since it's not available in JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// biome-ignore lint/suspicious/noExplicitAny: Mock data for test
global.ResizeObserver = ResizeObserverMock as any;

const originalRandomUUID = global.crypto?.randomUUID;

beforeAll(() => {
  if (!global.crypto) {
    // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
    (global as any).crypto = {};
  }
  let id = 0;
  global.crypto.randomUUID = jest.fn(
    () =>
      `123e4567-e89b-12d3-a456-${(id++).toString().padStart(12, "0")}` as `${string}-${string}-${string}-${string}-${string}`,
  );
});

afterAll(() => {
  global.crypto.randomUUID = originalRandomUUID;
});

describe("InfiniteScrollEffect", () => {
  it("renders children without crashing", () => {
    const { container } = render(
      <InfiniteScrollEffect>
        <div data-testid="child">Test Content</div>
      </InfiniteScrollEffect>,
    );
    expect(container).toBeInTheDocument();
  });

  it("generates random keys securely using crypto.randomUUID", () => {
    render(
      <InfiniteScrollEffect>
        <div data-testid="child">Test Content</div>
      </InfiniteScrollEffect>,
    );

    expect(global.crypto.randomUUID).toHaveBeenCalled();
  });
});
