import { act, render } from "@testing-library/react";
import { useMobileDetection } from "../../../../hooks/useMobileDetection";
import { AuthProvider, useAuth } from "../AuthContext";
import { ERROR_MESSAGES } from "../constants";

// Mock the hook
jest.mock("../../../../hooks/useMobileDetection", () => ({
  useMobileDetection: jest.fn(),
}));

const mockUseMobileDetection = useMobileDetection as jest.Mock;

describe("AuthContext Storage Error Paths", () => {
  let originalSessionStorage: Storage;
  const mockWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeAll(() => {
    originalSessionStorage = window.sessionStorage;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMobileDetection.mockReturnValue({ isMobile: false });

    // Default working mock
    Object.defineProperty(window, "sessionStorage", {
      writable: true,
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "sessionStorage", {
      writable: true,
      value: originalSessionStorage,
    });
    mockWarn.mockRestore();
    mockError.mockRestore();
  });

  // A simple component to consume the context for testing
  const TestComponent = () => {
    const { completeHack, logout, isUnlocked } = useAuth();
    return (
      <div>
        <span data-testid="status">{isUnlocked ? "Unlocked" : "Locked"}</span>
        <button type="button" onClick={completeHack} data-testid="complete">
          Complete Hack
        </button>
        <button type="button" onClick={logout} data-testid="logout">
          Logout
        </button>
      </div>
    );
  };

  const renderProvider = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
  };

  test("getSessionData catches and logs errors when sessionStorage.getItem throws", () => {
    const error = new Error("Storage is broken");
    window.sessionStorage.getItem = jest.fn().mockImplementation(() => {
      throw error;
    });

    renderProvider();

    // It runs for default and mobile keys during initialization
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      error,
    );
  });

  test("clearSessionData catches and logs errors when sessionStorage.removeItem throws", () => {
    const error = new Error("Cannot remove");
    window.sessionStorage.removeItem = jest.fn().mockImplementation(() => {
      throw error;
    });

    const { getByTestId } = renderProvider();

    act(() => {
      getByTestId("logout").click();
    });

    // We expect clearSessionData to be called during logout reset
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      error,
    );
  });

  test("setSessionData catches and logs generic errors", () => {
    const error = new Error("Cannot set");
    window.sessionStorage.setItem = jest.fn().mockImplementation(() => {
      throw error;
    });

    const { getByTestId } = renderProvider();

    act(() => {
      getByTestId("complete").click();
    });

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      error,
    );
  });

  test("setSessionData handles QuotaExceededError by cleaning up and retrying", () => {
    const quotaError = new Error("Quota exceeded");
    quotaError.name = "QuotaExceededError";

    const mockRemoveItem = jest.fn();

    // Mock setItem to throw QuotaExceededError the first time, then succeed
    const mockSetItem = jest
      .fn()
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementationOnce(() => {});

    window.sessionStorage.removeItem = mockRemoveItem;
    window.sessionStorage.setItem = mockSetItem;

    const { getByTestId } = renderProvider();

    act(() => {
      getByTestId("complete").click();
    });

    // Should warn about initial failure
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      quotaError,
    );

    // Should attempt to clear keys
    expect(mockRemoveItem).toHaveBeenCalled();

    // Should have retried setItem
    expect(mockSetItem).toHaveBeenCalledTimes(3);
  });

  test("setSessionData handles error during retry after QuotaExceededError", () => {
    const quotaError = new Error("Quota exceeded");
    quotaError.name = "QuotaExceededError";
    const retryError = new Error("Still cannot set");

    const mockRemoveItem = jest.fn();

    // Mock setItem to throw QuotaExceededError the first time, then another error
    const mockSetItem = jest
      .fn()
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementationOnce(() => {
        throw retryError;
      });

    window.sessionStorage.removeItem = mockRemoveItem;
    window.sessionStorage.setItem = mockSetItem;

    const { getByTestId } = renderProvider();

    act(() => {
      getByTestId("complete").click();
    });

    // Should warn about initial failure
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      quotaError,
    );

    // Should log error about retry failure
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining("even after cleanup"),
      retryError,
    );
  });
});
