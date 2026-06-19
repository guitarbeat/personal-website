import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoadingSequence from "../LoadingSequence";

describe("LoadingSequence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset body style
    document.body.style.overflow = "";
    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when not visible", () => {
    const { container } = render(
      <LoadingSequence isVisible={false} isReadyToReveal={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders masks and sets body overflow to hidden when visible", () => {
    render(<LoadingSequence isVisible={true} isReadyToReveal={false} />);

    expect(screen.getByTestId("site-loader")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow when unmounted", () => {
    const { unmount } = render(
      <LoadingSequence isVisible={true} isReadyToReveal={false} />,
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("executes reveal animation sequence and calls onExitComplete", () => {
    const onExitComplete = jest.fn();
    render(
      <LoadingSequence
        isVisible={true}
        isReadyToReveal={true}
        onExitComplete={onExitComplete}
      />,
    );

    // Initial state
    const topMask = screen.getByTestId("site-loader");
    expect(topMask.style.transform).not.toBe("scaleY(0)");

    // Fast-forward past REVEAL_MASKS_MS (500)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(topMask.style.transform).toBe("scaleY(0)");
    expect(onExitComplete).not.toHaveBeenCalled();

    // Fast-forward past COMPLETE_MS (2000)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(topMask.style.display).toBe("none");
    expect(document.body.style.overflow).toBe("");
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it("handles prefers-reduced-motion correctly", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
      })),
    });

    const onExitComplete = jest.fn();
    render(
      <LoadingSequence
        isVisible={true}
        isReadyToReveal={true}
        onExitComplete={onExitComplete}
      />,
    );

    const topMask = screen.getByTestId("site-loader");

    // Fast-forward past REDUCED_COMPLETE_MS (150)
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(topMask.style.display).toBe("none");
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });
});
