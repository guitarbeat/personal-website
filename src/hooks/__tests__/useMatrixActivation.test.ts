import { act, renderHook } from "@testing-library/react";
import {
  shouldShowMatrixFromSearch,
  useMatrixActivation,
} from "../useMatrixActivation";

describe("shouldShowMatrixFromSearch", () => {
  it("returns false if search is empty", () => {
    expect(shouldShowMatrixFromSearch("")).toBe(false);
    expect(shouldShowMatrixFromSearch(new URLSearchParams())).toBe(false);
  });

  it("returns false if matrix param is missing", () => {
    expect(shouldShowMatrixFromSearch("?other=1")).toBe(false);
  });

  it("returns false if matrix param has no value", () => {
    expect(shouldShowMatrixFromSearch("?matrix")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=   ")).toBe(false);
  });

  it("returns false for disabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=0")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=false")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=off")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=no")).toBe(false);
  });

  it("returns true for enabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=1")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=true")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=on")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=yes")).toBe(true);
  });

  it("returns false for unknown values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=maybe")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=hello")).toBe(false);
  });

  it("handles case insensitivity and whitespace", () => {
    expect(shouldShowMatrixFromSearch("?matrix= TRUE  ")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=  oFf ")).toBe(false);
  });
});

describe("useMatrixActivation", () => {
  const originalLocation = window.location;

  const setLocationSearch = (search: string) => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, search },
    });
  };

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("initializes to false if no matrix param in location", () => {
    setLocationSearch("");
    const { result } = renderHook(() => useMatrixActivation());
    expect(result.current.showMatrix).toBe(false);
  });

  it("initializes to true if valid matrix param in location", () => {
    setLocationSearch("?matrix=true");
    const { result } = renderHook(() => useMatrixActivation());
    expect(result.current.showMatrix).toBe(true);
  });

  it("handles handleMatrixActivate", () => {
    setLocationSearch("");
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleMatrixActivate();
    });

    expect(result.current.showMatrix).toBe(true);
  });

  it("handles handleMatrixDismiss", () => {
    setLocationSearch("?matrix=true");
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleMatrixDismiss();
    });

    expect(result.current.showMatrix).toBe(false);
  });

  it("handles handleRouteMatrixChange", () => {
    setLocationSearch("");
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      result.current.handleRouteMatrixChange(true);
    });

    expect(result.current.showMatrix).toBe(true);

    act(() => {
      result.current.handleRouteMatrixChange(false);
    });

    expect(result.current.showMatrix).toBe(false);
  });

  it("calls matrixReadyCallback when showMatrix becomes true", () => {
    setLocationSearch("");
    const { result } = renderHook(() => useMatrixActivation());
    const callback = jest.fn();

    act(() => {
      result.current.handleMatrixReady(callback);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.handleMatrixActivate();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call matrixReadyCallback if callback is not a function", () => {
    setLocationSearch("");
    const { result } = renderHook(() => useMatrixActivation());

    act(() => {
      // @ts-expect-error Testing invalid input
      result.current.handleMatrixReady(null);
    });

    act(() => {
      result.current.handleMatrixActivate();
    });

    // Should not throw
    expect(result.current.showMatrix).toBe(true);
  });

  it("does not call callback when showMatrix is already true and callback is set", () => {
    setLocationSearch("?matrix=true");
    const { result } = renderHook(() => useMatrixActivation());
    const callback = jest.fn();

    act(() => {
      result.current.handleMatrixReady(callback);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
