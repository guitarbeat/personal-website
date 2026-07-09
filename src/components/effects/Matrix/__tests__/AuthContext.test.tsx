import { render } from "@testing-library/react";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../AuthContext";
import { ERROR_MESSAGES } from "../constants";

// Mock the hook dependencies
jest.mock("../../../../hooks/useMobileDetection", () => ({
  useMobileDetection: () => ({ isMobile: false }),
}));

describe("AuthContext", () => {
  let mockSetItem: jest.Mock;
  let mockRemoveItem: jest.Mock;
  let mockGetItem: jest.Mock;

  beforeEach(() => {
    mockSetItem = jest.fn();
    mockRemoveItem = jest.fn();
    mockGetItem = jest.fn();

    // Setup window.sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        getItem: mockGetItem,
      },
      writable: true,
    });

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const TestComponent = ({
    onMount,
  }: {
    onMount: (auth: ReturnType<typeof useAuth>) => void;
  }) => {
    const auth = useAuth();
    useEffect(() => {
      onMount(auth);
    }, [auth, onMount]);
    return null;
  };

  it("handles QuotaExceededError and retries successfully", () => {
    // 1st call: QuotaExceededError
    // 2nd call: timestamp setItem (success) - wait, completeHack calls setSessionData twice (unlockedKey, timestampKey)
    // Let's just make the first one fail

    const quotaError = new Error("Storage is full");
    quotaError.name = "QuotaExceededError";

    mockSetItem
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementation(() => {}); // Succeed on subsequent calls

    render(
      <AuthProvider>
        <TestComponent onMount={(auth) => auth.completeHack()} />
      </AuthProvider>,
    );

    // Should have tried to set the unlockedKey and timestampKey
    expect(mockSetItem).toHaveBeenCalled();

    // Should have attempted to remove all SESSION_KEYS values
    expect(mockRemoveItem).toHaveBeenCalledWith("matrix_auth_unlocked");
    expect(mockRemoveItem).toHaveBeenCalledWith("matrix_auth_timestamp");
    expect(mockRemoveItem).toHaveBeenCalledWith("matrix_auth_mobile_unlocked");
    expect(mockRemoveItem).toHaveBeenCalledWith("matrix_auth_mobile_timestamp");

    // Because we use Date.now(), checking the exact arguments for setItem is tricky,
    // but we can verify it was called again after removeItem.
    // The flow:
    // setItem (fails) -> removeItem(k1, k2, k3, k4) -> setItem (retry succeeds) -> setItem (second key, succeeds)
    expect(mockSetItem.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      quotaError,
    );
  });

  it("logs error if retry fails after QuotaExceededError", () => {
    const quotaError = new Error("Storage is full");
    quotaError.name = "QuotaExceededError";

    const retryError = new Error("Retry failed");

    // Fail both the initial attempt and the retry attempt
    mockSetItem
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementationOnce(() => {
        throw retryError;
      })
      .mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent onMount={(auth) => auth.completeHack()} />
      </AuthProvider>,
    );

    expect(console.error).toHaveBeenCalledWith(
      `${ERROR_MESSAGES.STORAGE_ERROR} even after cleanup:`,
      retryError,
    );
  });
});
