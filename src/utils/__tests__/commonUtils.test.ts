import {
  clamp,
  cn,
  copyPoint,
  createTimeout,
  debounce,
  generateId,
  getWindowDimensions,
  isAboveBreakpoint,
  randomFloat,
  randomInt,
  subtractPoints,
  throttle,
  throttleAdvanced,
} from "../commonUtils";

describe("commonUtils", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns min when value is less than min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("returns max when value is greater than max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("randomInt", () => {
    it("returns integer within range", () => {
      const val = randomInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    });

    it("handles min equal to max", () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe("randomFloat", () => {
    it("returns float within range", () => {
      const val = randomFloat(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThan(10); // randomFloat is exclusive of max
    });

    it("handles min equal to max", () => {
      expect(randomFloat(3.14, 3.14)).toBe(3.14);
    });
  });

  describe("cn", () => {
    it("returns base class when no additional classes", () => {
      expect(cn("base")).toBe("base");
    });

    it("combines classes correctly", () => {
      expect(cn("base", "foo", "bar")).toBe("base foo bar");
    });

    it("filters falsy values", () => {
      expect(cn("base", false && "foo", null, undefined, "bar", "")).toBe(
        "base bar",
      );
    });

    it("trims whitespace only strings", () => {
      expect(cn("base", "   ", "foo")).toBe("base foo");
    });
  });

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

  describe("getWindowDimensions", () => {
    it("returns window dimensions", () => {
      // JSDOM default dimensions might vary, but usually they are defined
      const dims = getWindowDimensions();
      expect(typeof dims.width).toBe("number");
      expect(typeof dims.height).toBe("number");
    });
  });

  describe("generateId", () => {
    it("generates ID of default length 5", () => {
      expect(generateId().length).toBe(5);
    });

    it("generates ID of specified length", () => {
      expect(generateId(10).length).toBe(10);
    });

    it("uses default alphabet if not provided", () => {
      const id = generateId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("Point utilities", () => {
    it("copyPoint returns a new object with same values", () => {
      const p = { x: 10, y: 20 };
      const copy = copyPoint(p);
      expect(copy).toEqual(p);
      expect(copy).not.toBe(p);
    });

    it("subtractPoints returns difference", () => {
      const p1 = { x: 10, y: 20 };
      const p2 = { x: 4, y: 5 };
      expect(subtractPoints(p1, p2)).toEqual({ x: 6, y: 15 });
    });
  });

  describe("createTimeout", () => {
    jest.useFakeTimers();

    it("executes callback after delay", () => {
      jest.useFakeTimers();
      const cb = jest.fn();
      createTimeout(cb, 100);
      expect(cb).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(cb).toHaveBeenCalled();
    });

    it("can be cleared", () => {
      const cb = jest.fn();
      const clear = createTimeout(cb, 100);
      clear();
      jest.useFakeTimers();
      jest.advanceTimersByTime(100);
      expect(cb).not.toHaveBeenCalled();
    });

    jest.useRealTimers();
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
      jest.useFakeTimers();
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
      jest.useFakeTimers();
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
