import healthHandler from "../../../api/health.mjs";
import contentHandler from "../../../api/content.mjs";
import contentRefreshHandler from "../../../api/content-refresh.mjs";
import * as notionModule from "../notion/index.mjs";

jest.mock("../notion/index.mjs", () => {
  const original = jest.requireActual("../notion/index.mjs");
  return {
    __esModule: true,
    ...original,
    getHealthSummary: jest.fn(),
    getContentResponse: jest.fn(),
    isAuthorizedCronRequest: jest.fn(),
    refreshContentSnapshot: jest.fn(),
  };
});

describe("API Error Logging Security", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  };

  it("health.mjs scrubs stack traces from error logs", async () => {
    notionModule.getHealthSummary.mockRejectedValue(
      new Error("Sensitive database error"),
    );

    const req = { method: "GET", headers: {} };
    const res = mockRes();

    await healthHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(call[0]);
        return parsed.error === "Sensitive database error";
      } catch {
        return false;
      }
    });

    expect(logCall).toBeDefined();
    const parsedLog = JSON.parse(logCall[0]);
    expect(parsedLog.error).toBe("Sensitive database error");
    expect(parsedLog.stack).toBeUndefined();
  });

  it("content.mjs scrubs stack traces from error logs", async () => {
    notionModule.getContentResponse.mockRejectedValue(
      new Error("Content fetch failure"),
    );

    const req = { method: "GET", headers: {} };
    const res = mockRes();

    await contentHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(call[0]);
        return parsed.error === "Content fetch failure";
      } catch {
        return false;
      }
    });

    expect(logCall).toBeDefined();
    const parsedLog = JSON.parse(logCall[0]);
    expect(parsedLog.error).toBe("Content fetch failure");
    expect(parsedLog.stack).toBeUndefined();
  });

  it("content-refresh.mjs scrubs stack traces from error logs", async () => {
    notionModule.isAuthorizedCronRequest.mockReturnValue(true);
    notionModule.refreshContentSnapshot.mockRejectedValue(
      new Error("Refresh failure"),
    );

    const req = { method: "POST", headers: {} };
    const res = mockRes();

    await contentRefreshHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(call[0]);
        return parsed.error === "Refresh failure";
      } catch {
        return false;
      }
    });

    expect(logCall).toBeDefined();
    const parsedLog = JSON.parse(logCall[0]);
    expect(parsedLog.error).toBe("Refresh failure");
    expect(parsedLog.stack).toBeUndefined();
  });
});
