import { renderHook } from "@testing-library/react";
import { useHackTelemetry } from "../useHackTelemetry";

describe("useHackTelemetry", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "crypto", {
        value: {
          getRandomValues: (arr: Uint32Array) => {
            arr[0] = 2147483648; // 0.5
            return arr;
          },
        },
        configurable: true,
      });
    }
  });

  it("generates matrix coordinates and telemetry using secureRandom when hack is complete", () => {
    const setHackFeedback = jest.fn();
    const setHackingBuffer = jest.fn();

    const { result, rerender } = renderHook(
      ({ isHackComplete }) =>
        useHackTelemetry({
          isHackComplete,
          setHackFeedback,
          setHackingBuffer,
        }),
      { initialProps: { isHackComplete: true } },
    );

    rerender({ isHackComplete: true });

    expect(result.current).not.toBeNull();
    expect(result.current?.matrixCoordinate).toMatch(
      /^[0-9A-F]{2}:[0-9A-F]{3}$/,
    );
    expect(setHackFeedback).toHaveBeenCalled();
    expect(setHackingBuffer).toHaveBeenCalled();
  });
});
