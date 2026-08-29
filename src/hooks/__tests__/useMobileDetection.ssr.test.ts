/**
 * @jest-environment node
 */
import React from "react";
import ReactDOMServer from "react-dom/server";
import { useMobileDetection } from "../useMobileDetection";

describe("useMobileDetection in SSR", () => {
  it("should safely handle undefined window without throwing", () => {
    // Ensure window is undefined in this environment
    expect(typeof window).toBe("undefined");

    let result: ReturnType<typeof useMobileDetection> | null = null;

    const TestComponent = () => {
      result = useMobileDetection();
      return React.createElement("div", null, "test");
    };

    const html = ReactDOMServer.renderToString(
      React.createElement(TestComponent),
    );

    expect(html).toContain("test");
    expect(result).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: needed for closure type narrowing in test
    const res = result!;
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.screenWidth).toBe(0);
    expect(res.screenHeight).toBe(0);
    expect(res.isTouchDevice).toBe(false);
    expect(res.isMobileUserAgent).toBe(false);

    // Test helper functions
    expect(res.isBelowBreakpoint(1000)).toBe(true); // screenWidth is 0
    expect(res.isAboveBreakpoint(1000)).toBe(false);
    expect(res.isBetweenBreakpoints(0, 1000)).toBe(true);
  });
});
