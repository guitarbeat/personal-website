import { act, renderHook } from "@testing-library/react";
import {
  useCompanionPosition,
  type UseCompanionPositionOptions,
} from "../useCompanionPosition";

describe("useCompanionPosition localStorage interactions", () => {
  const STORAGE_KEY = "test-companion-position";
  const defaultOptions: UseCompanionPositionOptions = {
    size: 100,
    placement: "bottom-right",
    inset: 10,
    persistPosition: true,
    storageKey: STORAGE_KEY,
  };

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("reads stored position from localStorage on initialization when valid", () => {
    const validPoint = { x: 150, y: 200 };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validPoint));

    const { result } = renderHook(() =>
      useCompanionPosition(defaultOptions),
    );

    expect(result.current.currentPosition).toEqual(validPoint);
  });

  it("handles localStorage.getItem exceptions gracefully and falls back to default position", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access denied");
    });

    const defaultPos = { x: 50, y: 50 };
    const { result } = renderHook(() =>
      useCompanionPosition({
        ...defaultOptions,
        defaultPosition: defaultPos,
      }),
    );

    expect(result.current.currentPosition).toEqual(defaultPos);
  });

  it("handles invalid JSON stored in localStorage and falls back", () => {
    window.localStorage.setItem(STORAGE_KEY, "invalid-json{");

    const defaultPos = { x: 50, y: 50 };
    const { result } = renderHook(() =>
      useCompanionPosition({
        ...defaultOptions,
        defaultPosition: defaultPos,
      }),
    );

    expect(result.current.currentPosition).toEqual(defaultPos);
  });

  it("handles non-finite or invalid numbers in stored position", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: "invalid", y: 100 }),
    );

    const defaultPos = { x: 50, y: 50 };
    const { result } = renderHook(() =>
      useCompanionPosition({
        ...defaultOptions,
        defaultPosition: defaultPos,
      }),
    );

    expect(result.current.currentPosition).toEqual(defaultPos);
  });

  it("persists position to localStorage when commitPosition is called", () => {
    const { result } = renderHook(() =>
      useCompanionPosition(defaultOptions),
    );

    const nextPos = { x: 120, y: 140 };
    act(() => {
      result.current.commitPosition(nextPos);
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(nextPos);
  });

  it("handles localStorage.setItem exceptions gracefully when commitPosition is called", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() =>
      useCompanionPosition(defaultOptions),
    );

    const nextPos = { x: 120, y: 140 };
    let returnedPos: { x: number; y: number } | undefined;
    expect(() => {
      act(() => {
        returnedPos = result.current.commitPosition(nextPos);
      });
    }).not.toThrow();

    expect(returnedPos).toEqual(nextPos);
    expect(result.current.currentPosition).toEqual(nextPos);
  });

  it("does not read or write to localStorage when persistPosition is false", () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() =>
      useCompanionPosition({
        ...defaultOptions,
        persistPosition: false,
      }),
    );

    expect(getItemSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.commitPosition({ x: 120, y: 140 });
    });

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
