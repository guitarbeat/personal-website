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
    expect(result?.isMobile).toBe(false);
    expect(result?.isTablet).toBe(false);
    expect(result?.isDesktop).toBe(false);
    expect(result?.screenWidth).toBe(0);
    expect(result?.screenHeight).toBe(0);
    expect(result?.isTouchDevice).toBe(false);
    expect(result?.isMobileUserAgent).toBe(false);

    // Test helper functions
    expect(result?.isBelowBreakpoint(1000)).toBe(true); // screenWidth is 0
    expect(result?.isAboveBreakpoint(1000)).toBe(false);
    expect(result?.isBetweenBreakpoints(0, 1000)).toBe(true);
  });
});
