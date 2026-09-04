import NotionService from "../notionService";

describe("NotionService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("fetches content successfully when response is ok and payload is valid", async () => {
    const mockData = {
      data: { profile: { name: "Test User" } },
      meta: { fetchedAt: "2026-01-01T00:00:00.000Z" },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    const service = new NotionService();
    const result = await service.getAllData();

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith("/api/content", {
      method: "GET",
    });
  });

  it("throws error with nested error message when API error response contains error.message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: jest.fn().mockResolvedValue({
        error: { message: "Failed to connect to Notion API" },
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow(
      "Failed to connect to Notion API",
    );
  });

  it("throws error with failureType when error.message is missing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: jest.fn().mockResolvedValue({
        error: { failureType: "RATE_LIMIT_EXCEEDED" },
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("RATE_LIMIT_EXCEEDED");
  });

  it("throws error with code when error.message and failureType are missing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Unauthorized",
      json: jest.fn().mockResolvedValue({
        error: { code: "UNAUTHORIZED_ACCESS" },
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("UNAUTHORIZED_ACCESS");
  });

  it("throws error with top-level message string when payload has message property", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Forbidden",
      json: jest.fn().mockResolvedValue({
        message: "Access denied to resource",
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow(
      "Access denied to resource",
    );
  });

  it("falls back to statusText when payload is invalid, empty, or JSON parsing fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Service Unavailable",
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("Service Unavailable");
  });

  it("falls back to statusText when payload error is string or null", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad Gateway",
      json: jest.fn().mockResolvedValue({
        error: "Non-object error",
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("Bad Gateway");
  });

  it("falls back to statusText when payload has error object without message, failureType, or code", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Error",
      json: jest.fn().mockResolvedValue({
        error: {},
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("Internal Error");
  });

  it("falls back to statusText when top-level message is not a string", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: jest.fn().mockResolvedValue({
        message: 12345,
      }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("Bad Request");
  });

  it("falls back to statusText when payload is a primitive string or number", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Gateway Timeout",
      json: jest.fn().mockResolvedValue("Plain text error"),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow("Gateway Timeout");
  });

  it("throws error when response is ok but payload is invalid structure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as Response);

    const service = new NotionService();
    await expect(service.getAllData()).rejects.toThrow(
      "Content API returned an invalid response",
    );
  });
});
