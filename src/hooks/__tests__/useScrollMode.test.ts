import { act, renderHook } from "@testing-library/react";
import { useScrollMode } from "../useScrollMode";

describe("useScrollMode", () => {
  beforeEach(() => {
    jest.spyOn(window, "scrollBy").mockImplementation(() => {});
    jest.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts inactive", () => {
    const { result } = renderHook(() => useScrollMode());

    expect(result.current.isScrollMode).toBe(false);
    expect(result.current.isInScroll).toBe(false);
  });

  it("activates scroll mode", () => {
    const { result } = renderHook(() => useScrollMode());

    act(() => {
      result.current.activateScrollMode();
    });

    expect(result.current.isScrollMode).toBe(true);
  });

  it("transitions from scroll mode to in-scroll on Enter", () => {
    const { result } = renderHook(() => useScrollMode());

    act(() => {
      result.current.activateScrollMode();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(result.current.isScrollMode).toBe(false);
    expect(result.current.isInScroll).toBe(true);
  });

  it("cleans up animation frame on unmount while scroll mode is active", () => {
    const { result, unmount } = renderHook(() => useScrollMode());

    act(() => {
      result.current.activateScrollMode();
    });

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
