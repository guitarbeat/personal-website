import { act, render } from "@testing-library/react";
import { logger } from "@/utils/logger";
import { ERROR_MESSAGES } from "../constants";
import { UnlockProvider, useUnlock } from "../UnlockContext";

describe("UnlockContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("handles storage QuotaExceededError gracefully", () => {
    // Setup component to test useUnlock context
    // biome-ignore lint/suspicious/noExplicitAny: Mock data for test
    let contextValue: any = null;
    const TestComponent = () => {
      contextValue = useUnlock();
      return null;
    };

    // Mock console.warn and console.error
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

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
      <UnlockProvider>
        <TestComponent />
      </UnlockProvider>,
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
      contextValue = useUnlock();
      return null;
    };

    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    const quotaError = new Error("Quota Exceeded");
    quotaError.name = "QuotaExceededError";

    setItemSpy.mockImplementation(() => {
      throw quotaError;
    });

    render(
      <UnlockProvider>
        <TestComponent />
      </UnlockProvider>,
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
