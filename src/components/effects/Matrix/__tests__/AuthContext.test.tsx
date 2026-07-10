import { act, render } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { ERROR_MESSAGES } from "../constants";

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("handles storage QuotaExceededError gracefully", () => {
    // Setup component to test useAuth context
    // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
    let contextValue: any = null;
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };

    // Mock console.warn and console.error
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock sessionStorage.setItem to throw QuotaExceededError initially
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    const quotaError = new Error("Quota Exceeded");
    quotaError.name = "QuotaExceededError";

    // Track calls to setItem
    let callCount = 0;
    setItemSpy.mockImplementation(() => {
      callCount++;
      // We only want to throw the error on the FIRST setItem attempt
      if (callCount === 1) {
        throw quotaError;
      }
    });

    // Mock clearSessionData behavior implicitly through removeItem spy
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Trigger completeHack which calls setSessionData
    act(() => {
      contextValue.completeHack();
    });

    // Verify error was handled
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      quotaError,
    );

    // Verify cleanup was attempted
    expect(removeItemSpy).toHaveBeenCalled();

    // completeHack sets two items: unlockedKey and timestampKey
    // If the first one throws a quota error, it will retry once
    // Then it will proceed to set the second one
    expect(setItemSpy).toHaveBeenCalledTimes(3);

    warnSpy.mockRestore();
    errorSpy.mockRestore();
    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();
  });

  it("handles storage QuotaExceededError failure gracefully", () => {
    // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
    let contextValue: any = null;
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    const quotaError = new Error("Quota Exceeded");
    quotaError.name = "QuotaExceededError";

    setItemSpy.mockImplementation(() => {
      throw quotaError;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    act(() => {
      contextValue.completeHack();
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGES.STORAGE_ERROR),
      quotaError,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `${ERROR_MESSAGES.STORAGE_ERROR} even after cleanup:`,
      ),
      quotaError,
    );

    warnSpy.mockRestore();
    errorSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
