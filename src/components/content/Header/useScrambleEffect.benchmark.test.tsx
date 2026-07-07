import { renderHook } from "@testing-library/react";
import useScrambleEffect from "./useScrambleEffect";
import React from "react";

jest.mock("../../../utils/commonUtils", () => ({
  isAboveBreakpoint: jest.fn().mockReturnValue(true),
  randomInt: jest.fn().mockReturnValue(0),
}));

describe("useScrambleEffect Performance Benchmark", () => {
  it("should measure the time to scramble", () => {
    // Append to document.body to simulate connected elements
    const div = document.createElement("div");
    document.body.appendChild(div);

    for (let i = 0; i < 2000; i++) {
        const h1 = document.createElement("h1");
        h1.textContent = "This is a very long text to test the performance of the scramble effect. ".repeat(20);
        div.appendChild(h1);
    }

    const ref = { current: div };

    const start = performance.now();
    renderHook(() => useScrambleEffect(ref as React.RefObject<HTMLElement | null>));
    const end = performance.now();

    console.log(`Scramble effect took ${end - start} ms`);
    document.body.removeChild(div);
  });
});
