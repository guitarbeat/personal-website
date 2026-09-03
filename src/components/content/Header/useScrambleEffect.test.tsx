import { renderHook } from "@testing-library/react";
import * as commonUtils from "@/utils/commonUtils";
import useScrambleEffect from "./useScrambleEffect";

describe("useScrambleEffect", () => {
  let isAboveBreakpointSpy: jest.SpyInstance;

  beforeEach(() => {
    isAboveBreakpointSpy = jest
      .spyOn(commonUtils, "isAboveBreakpoint")
      .mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does nothing when ref.current is null", () => {
    const ref = { current: null };
    renderHook(() => useScrambleEffect(ref));
    expect(isAboveBreakpointSpy).not.toHaveBeenCalled();
  });

  it("adds mouseover and mouseout event listeners and cleans them up on unmount", () => {
    const container = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.textContent = "Hi";
    container.appendChild(h1);
    document.body.appendChild(container);

    const ref = { current: container };
    const { unmount } = renderHook(() => useScrambleEffect(ref));

    const letterSpan = container.querySelector(".letter") as HTMLElement;
    expect(letterSpan).not.toBeNull();

    const removeEventListenerSpy = jest.spyOn(
      letterSpan,
      "removeEventListener",
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mouseover",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mouseout",
      expect.any(Function),
    );

    document.body.removeChild(container);
  });
});
