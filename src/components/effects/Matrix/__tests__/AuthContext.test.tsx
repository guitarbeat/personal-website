import { act, render, screen } from "@testing-library/react";
import { useMobileDetection } from "../../../../hooks/useMobileDetection";
import { AuthProvider, useAuth } from "../AuthContext";
import { ANIMATION_TIMING, SECURITY } from "../constants";

// Mock the mobile detection hook
jest.mock("../../../../hooks/useMobileDetection");

// Test Consumer Component
const TestConsumer = () => {
  const {
    isUnlocked,
    isMobileUnlocked,
    toolsAccessible,
    showSuccessFeedback,
    completeHack,
    logout,
    isMobile,
  } = useAuth();

  return (
    <div>
      <div data-testid="isUnlocked">{String(isUnlocked)}</div>
      <div data-testid="isMobileUnlocked">{String(isMobileUnlocked)}</div>
      <div data-testid="toolsAccessible">{String(toolsAccessible)}</div>
      <div data-testid="showSuccessFeedback">{String(showSuccessFeedback)}</div>
      <div data-testid="isMobile">{String(isMobile)}</div>
      <button type="button" onClick={completeHack}>
        Hack
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  const mockUseMobileDetection = useMobileDetection as jest.Mock;

  beforeEach(() => {
    // Clear session storage before each test
    window.sessionStorage.clear();

    // Reset mocks
    jest.clearAllMocks();

    // Default to desktop
    mockUseMobileDetection.mockReturnValue({ isMobile: false });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should provide initial locked state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("isUnlocked").textContent).toBe("false");
    expect(screen.getByTestId("isMobileUnlocked").textContent).toBe("false");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("false");
    expect(screen.getByTestId("showSuccessFeedback").textContent).toBe("false");
  });

  it("should handle completeHack on desktop", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("Hack").click();
    });

    // Immediate state after hack
    expect(screen.getByTestId("showSuccessFeedback").textContent).toBe("true");

    // Fast forward past success feedback duration
    act(() => {
      jest.advanceTimersByTime(ANIMATION_TIMING.SUCCESS_FEEDBACK_DURATION);
    });
    expect(screen.getByTestId("showSuccessFeedback").textContent).toBe("false");

    // Fast forward past modal close delay to finalize unlock
    act(() => {
      jest.advanceTimersByTime(ANIMATION_TIMING.MATRIX_MODAL_CLOSE_DELAY);
    });

    expect(screen.getByTestId("isUnlocked").textContent).toBe("true");
    expect(screen.getByTestId("isMobileUnlocked").textContent).toBe("false");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("true");

    // Verify sessionStorage
    expect(window.sessionStorage.getItem("matrix_auth_unlocked")).toBe("true");
    expect(window.sessionStorage.getItem("matrix_auth_timestamp")).toBeTruthy();
  });

  it("should handle completeHack on mobile", () => {
    mockUseMobileDetection.mockReturnValue({ isMobile: true });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("Hack").click();
    });

    // Fast forward past all timeouts
    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId("isUnlocked").textContent).toBe("true");
    expect(screen.getByTestId("isMobileUnlocked").textContent).toBe("true");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("true");

    // Verify sessionStorage for mobile
    expect(window.sessionStorage.getItem("matrix_auth_mobile_unlocked")).toBe(
      "true",
    );
    expect(
      window.sessionStorage.getItem("matrix_auth_mobile_timestamp"),
    ).toBeTruthy();
  });

  it("should handle logout and clear state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Complete hack first
    act(() => {
      screen.getByText("Hack").click();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId("isUnlocked").textContent).toBe("true");

    // Then logout
    act(() => {
      screen.getByText("Logout").click();
    });

    expect(screen.getByTestId("isUnlocked").textContent).toBe("false");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("false");

    // Verify sessionStorage cleared
    expect(window.sessionStorage.getItem("matrix_auth_unlocked")).toBeNull();
    expect(window.sessionStorage.getItem("matrix_auth_timestamp")).toBeNull();
  });

  it("should initialize from valid session storage", () => {
    // Setup valid session
    window.sessionStorage.setItem("matrix_auth_unlocked", "true");
    window.sessionStorage.setItem(
      "matrix_auth_timestamp",
      JSON.stringify(Date.now()),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("isUnlocked").textContent).toBe("true");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("true");
  });

  it("should ignore expired session storage", () => {
    // Setup expired session
    window.sessionStorage.setItem("matrix_auth_unlocked", "true");
    const oldTimestamp = Date.now() - SECURITY.SESSION.DURATION_MS - 1000;
    window.sessionStorage.setItem(
      "matrix_auth_timestamp",
      JSON.stringify(oldTimestamp),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("isUnlocked").textContent).toBe("false");
    expect(screen.getByTestId("toolsAccessible").textContent).toBe("false");

    // Should have cleared expired session
    expect(window.sessionStorage.getItem("matrix_auth_unlocked")).toBeNull();
  });

  it("throws error if useAuth is used outside provider", () => {
    // Mock console.error to avoid React error boundary logging
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    consoleError.mockRestore();
  });
});
