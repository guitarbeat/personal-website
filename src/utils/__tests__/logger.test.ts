import { logger } from "../logger";

describe("logger utility", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should forward info calls to console.info", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    logger.info("info message", { key: "value" }, 123);
    expect(spy).toHaveBeenCalledWith("info message", { key: "value" }, 123);
  });

  it("should forward warn calls to console.warn", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warn message", "another arg");
    expect(spy).toHaveBeenCalledWith("warn message", "another arg");
  });

  it("should forward error calls to console.error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const errorObj = new Error("test error");
    logger.error("error occurred:", errorObj);
    expect(spy).toHaveBeenCalledWith("error occurred:", errorObj);
  });

  it("should forward log calls to console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    logger.log("log message", true);
    expect(spy).toHaveBeenCalledWith("log message", true);
  });

  it("should handle calls with no arguments", () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.info();
    logger.warn();
    logger.error();
    logger.log();

    expect(infoSpy).toHaveBeenCalledWith();
    expect(warnSpy).toHaveBeenCalledWith();
    expect(errorSpy).toHaveBeenCalledWith();
    expect(logSpy).toHaveBeenCalledWith();
  });

  it("should isolate console calls to the intended method", () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.info("only info");

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("should pass primitive and complex arguments including null and undefined", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const fn = () => {};
    const sym = Symbol("test");

    logger.log("test", null, undefined, fn, sym, [1, 2]);

    expect(logSpy).toHaveBeenCalledWith(
      "test",
      null,
      undefined,
      fn,
      sym,
      [1, 2],
    );
  });
});
