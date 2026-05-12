import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import InfiniteScrollEffect from "./InfiniteScrollEffect";

// Mock resize observer since it's not available in JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;

const originalRandomUUID = global.crypto?.randomUUID;

beforeAll(() => {
  if (!global.crypto) {
    (global as any).crypto = {};
  }
  let id = 0;
  global.crypto.randomUUID = jest.fn(() => `mocked-uuid-${id++}`);
});

afterAll(() => {
  global.crypto.randomUUID = originalRandomUUID;
});

describe("InfiniteScrollEffect", () => {
  it("renders children without crashing", () => {
    const { container } = render(
      <InfiniteScrollEffect>
        <div data-testid="child">Test Content</div>
      </InfiniteScrollEffect>
    );
    expect(container).toBeInTheDocument();
  });

  it("generates random keys securely using crypto.randomUUID", () => {
    render(
      <InfiniteScrollEffect>
        <div data-testid="child">Test Content</div>
      </InfiniteScrollEffect>
    );

    expect(global.crypto.randomUUID).toHaveBeenCalled();
  });
});
