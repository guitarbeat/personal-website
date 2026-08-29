import { act, renderHook } from "@testing-library/react";
import { useSpotifyWidget } from "../useSpotifyWidget";

describe("useSpotifyWidget", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("adds and removes window error listeners on mount and unmount", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useSpotifyWidget());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function),
    );
  });

  it("suppresses error events related to spotify scheme", () => {
    renderHook(() => useSpotifyWidget());

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    const spotifyErrorEvent = new ErrorEvent("error", {
      message: "Navigation failed: spotify:protocol error",
    });
    Object.defineProperty(spotifyErrorEvent, "preventDefault", {
      value: preventDefault,
    });
    Object.defineProperty(spotifyErrorEvent, "stopPropagation", {
      value: stopPropagation,
    });

    act(() => {
      window.dispatchEvent(spotifyErrorEvent);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("does not suppress unrelated error events", () => {
    renderHook(() => useSpotifyWidget());

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    const normalErrorEvent = new ErrorEvent("error", {
      message: "Unrelated script error",
    });
    Object.defineProperty(normalErrorEvent, "preventDefault", {
      value: preventDefault,
    });
    Object.defineProperty(normalErrorEvent, "stopPropagation", {
      value: stopPropagation,
    });

    act(() => {
      window.dispatchEvent(normalErrorEvent);
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("suppresses unhandled rejection events related to spotify scheme", () => {
    renderHook(() => useSpotifyWidget());

    const preventDefault = jest.fn();

    const event = new Event("unhandledrejection") as Event & {
      reason?: { message?: string };
    };
    event.reason = {
      message: "scheme does not have a registered handler",
    };
    Object.defineProperty(event, "preventDefault", {
      value: preventDefault,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it("handles handleSpotifyClick by opening profile window and falling back on window close", () => {
    const { result } = renderHook(() => useSpotifyWidget());

    const mockNewWindow = {
      closed: false,
    };

    const windowOpenSpy = jest
      .spyOn(window, "open")
      .mockReturnValue(mockNewWindow as unknown as Window);

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    const mockEvent = {
      preventDefault,
      stopPropagation,
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleSpotifyClick(mockEvent);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://spotify-github-profile.kittinanx.com/api/view.svg?uid=31skxfoaghlkljkdiluds3g3decy&redirect=true",
      "_blank",
      "noopener,noreferrer",
    );

    // Simulate window closing due to scheme failure
    mockNewWindow.closed = true;

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://open.spotify.com/user/31skxfoaghlkljkdiluds3g3decy",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("falls back immediately if window.open returns null or closed window", () => {
    const { result } = renderHook(() => useSpotifyWidget());

    const windowOpenSpy = jest.spyOn(window, "open").mockReturnValue(null);

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    const mockEvent = {
      preventDefault,
      stopPropagation,
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleSpotifyClick(mockEvent);
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://open.spotify.com/user/31skxfoaghlkljkdiluds3g3decy",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
