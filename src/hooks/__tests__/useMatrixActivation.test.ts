import { act, renderHook } from "@testing-library/react";
import { shouldShowMatrixFromSearch, useMatrixActivation } from "../useMatrixActivation";

describe("shouldShowMatrixFromSearch", () => {
  it("returns false when no matrix parameter is present", () => {
    expect(shouldShowMatrixFromSearch("")).toBe(false);
    expect(shouldShowMatrixFromSearch("?other=1")).toBe(false);
  });

  it("returns false for empty matrix parameter", () => {
    expect(shouldShowMatrixFromSearch("?matrix=")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=   ")).toBe(false);
  });

  it("returns false for disabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=0")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=false")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=off")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=no")).toBe(false);
    // case insensitive / whitespace
    expect(shouldShowMatrixFromSearch("?matrix= False ")).toBe(false);
  });

  it("returns true for enabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=1")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=true")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=on")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=yes")).toBe(true);
    // case insensitive / whitespace
    expect(shouldShowMatrixFromSearch("?matrix= TRUE ")).toBe(true);
  });

  it("returns false for unknown values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=maybe")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=123")).toBe(false);
  });

  it("handles URLSearchParams object input correctly", () => {
    const params = new URLSearchParams("?matrix=true");
    expect(shouldShowMatrixFromSearch(params)).toBe(true);

    const paramsDisabled = new URLSearchParams("?matrix=false");
    expect(shouldShowMatrixFromSearch(paramsDisabled)).toBe(false);

    const emptyParams = new URLSearchParams();
    expect(shouldShowMatrixFromSearch(emptyParams)).toBe(false);
  });
});

describe("useMatrixActivation", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    // Safely delete and override window.location using Object.defineProperty
    // This circumvents jsdom navigation errors when altering location directly.
    delete (window as any).location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
    });
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    window.location.search = "";
    jest.clearAllMocks();
  });

  it("returns initial state false when no URL param is present", () => {
    const { result } = renderHook(() => useMatrixActivation());
    expect(result.current.showMatrix).toBe(false);
  });

  it("returns initial state true when URL param is enabled", () => {
    window.location.search = "?matrix=true";
    const { result } = renderHook(() => useMatrixActivation());
    expect(result.current.showMatrix).toBe(true);
  });

  it("changes state to true when handleMatrixActivate is called", () => {
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleMatrixActivate();
    });

    expect(result.current.showMatrix).toBe(true);
  });

  it("changes state to false when handleMatrixDismiss is called", () => {
    window.location.search = "?matrix=true";
    const { result } = renderHook(() => useMatrixActivation());

    expect(result.current.showMatrix).toBe(true);

    act(() => {
      result.current.handleMatrixDismiss();
    });

    expect(result.current.showMatrix).toBe(false);
  });

  it("updates state appropriately when handleRouteMatrixChange is called", () => {
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleRouteMatrixChange(true);
    });
    expect(result.current.showMatrix).toBe(true);

    act(() => {
      result.current.handleRouteMatrixChange(false);
    });
    expect(result.current.showMatrix).toBe(false);

    // Check it doesn't update unnecessarily if already false
    act(() => {
      result.current.handleRouteMatrixChange(false);
    });
    expect(result.current.showMatrix).toBe(false);
  });

  it("calls the provided callback when showMatrix becomes true", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleMatrixReady(callback);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.handleMatrixActivate();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call the provided callback if showMatrix stays false", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleMatrixReady(callback);
    });

    // Rerender just to simulate effect firing
    act(() => {
      result.current.handleRouteMatrixChange(false);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
