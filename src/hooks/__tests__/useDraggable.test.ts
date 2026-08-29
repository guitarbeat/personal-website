import { act, renderHook } from "@testing-library/react";
import { useDraggable } from "../useDraggable";

describe("useDraggable", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useDraggable());
    expect(result.current.elementRef.current).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.hasOverflow).toBe(false);
    expect(result.current.dragProps).toBeDefined();
  });

  it("handles mouse down and mouse up events", () => {
    const { result } = renderHook(() => useDraggable());
    const div = document.createElement("div");
    Object.defineProperty(div, "offsetLeft", { value: 0 });
    Object.defineProperty(div, "scrollLeft", { value: 0, writable: true });
    Object.defineProperty(div, "scrollWidth", { value: 500 });
    Object.defineProperty(div, "clientWidth", { value: 200 });
    div.scrollTo = jest.fn();

    (
      result.current.elementRef as React.MutableRefObject<HTMLDivElement | null>
    ).current = div;

    act(() => {
      result.current.dragProps.onMouseDown({
        pageX: 100,
      } as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(div.classList.contains("dragging")).toBe(true);

    act(() => {
      result.current.dragProps.onMouseUp();
    });

    expect(result.current.isDragging).toBe(false);
    expect(div.classList.contains("dragging")).toBe(false);
  });

  it("handles touch start, touch move, and snap on touch end", () => {
    const { result } = renderHook(() => useDraggable());
    const div = document.createElement("div");
    Object.defineProperty(div, "offsetLeft", { value: 0 });
    let scrollLeftVal = 0;
    Object.defineProperty(div, "scrollLeft", {
      get: () => scrollLeftVal,
      set: (val) => {
        scrollLeftVal = val;
      },
    });
    Object.defineProperty(div, "scrollWidth", { value: 500 });
    Object.defineProperty(div, "clientWidth", { value: 200 });
    div.scrollTo = jest.fn();

    (
      result.current.elementRef as React.MutableRefObject<HTMLDivElement | null>
    ).current = div;

    const preventDefaultMock = jest.fn();

    act(() => {
      result.current.dragProps.onTouchStart({
        touches: [{ pageX: 100 } as Touch],
        preventDefault: preventDefaultMock,
      } as unknown as React.TouchEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(preventDefaultMock).toHaveBeenCalled();

    act(() => {
      result.current.dragProps.onTouchMove({
        touches: [{ pageX: 90 } as Touch],
        preventDefault: preventDefaultMock,
      } as unknown as React.TouchEvent);
    });

    expect(scrollLeftVal).toBe(15);

    act(() => {
      result.current.dragProps.onTouchEnd();
    });

    expect(result.current.isDragging).toBe(false);
    expect(div.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
  });
});
