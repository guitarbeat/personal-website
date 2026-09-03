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
});
