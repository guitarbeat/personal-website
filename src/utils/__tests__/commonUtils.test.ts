import {
  isAboveBreakpoint,
  throttle,
  debounce,
  throttleAdvanced,
} from "../commonUtils";

describe("commonUtils", () => {
  describe("isAboveBreakpoint", () => {
    const originalInnerWidth = window.innerWidth;

    beforeAll(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    afterAll(() => {
      window.innerWidth = originalInnerWidth;
    });

    it("returns true when window width is greater than breakpoint", () => {
      window.innerWidth = 1024;
      expect(isAboveBreakpoint(768)).toBe(true);
    });

    it("returns false when window width is equal to breakpoint", () => {
      window.innerWidth = 768;
      expect(isAboveBreakpoint(768)).toBe(false);
    });

    it("returns false when window width is less than breakpoint", () => {
      window.innerWidth = 500;
      expect(isAboveBreakpoint(768)).toBe(false);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("executes immediately", () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("ignores calls within limit", () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      throttledFunc();
      throttledFunc();
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("executes again after limit", () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      throttledFunc();
      jest.advanceTimersByTime(150);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("does not execute immediately by default", () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      debouncedFunc();
      expect(func).not.toHaveBeenCalled();
    });

    it("executes once after wait", () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      debouncedFunc();
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("resets timer on subsequent calls", () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      debouncedFunc();
      jest.advanceTimersByTime(50);
      debouncedFunc();
      jest.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("executes immediately if immediate is true", () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100, true);
      debouncedFunc();
      expect(func).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttleAdvanced", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("executes leading edge and trailing edge by default", () => {
      const func = jest.fn();
      const throttledFunc = throttleAdvanced(func, 100);

      throttledFunc("first");
      expect(func).toHaveBeenCalledWith("first");
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc("second");
      throttledFunc("third");
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(150);
      expect(func).toHaveBeenCalledTimes(2);
      expect(func).toHaveBeenLastCalledWith("third");
    });

    it("executes only leading edge if trailing is false", () => {
      const func = jest.fn();
      const throttledFunc = throttleAdvanced(func, 100, {
        leading: true,
        trailing: false,
      });

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      jest.advanceTimersByTime(150);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("executes only trailing edge if leading is false", () => {
      const func = jest.fn();
      const throttledFunc = throttleAdvanced(func, 100, {
        leading: false,
        trailing: true,
      });

      throttledFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("can be cancelled", () => {
      const func = jest.fn();
      const throttledFunc = throttleAdvanced(func, 100);

      throttledFunc();
      throttledFunc();
      throttledFunc.cancel();

      jest.advanceTimersByTime(150);
      // Should have called once (leading), but trailing cancelled
      expect(func).toHaveBeenCalledTimes(1);
    });
  });
});
