import { fetchContent } from "./notionService";

describe("fetchContent", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should fetch and return content successfully", async () => {
    const mockResponse = {
      data: { test: "data" },
      meta: { test: "meta" },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await fetchContent();
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith("/api/content", {
      method: "GET",
    });
  });

  it("should throw error if payload is missing data property", async () => {
    const mockResponse = {
      meta: { test: "meta" },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    await expect(fetchContent()).rejects.toThrow(
      "Content API returned an invalid response. Start the Vite dev server with `pnpm start` and open http://localhost:8080 so `/api/content` is available."
    );
  });

  it("should throw error if payload is missing meta property", async () => {
    const mockResponse = {
      data: { test: "data" },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    await expect(fetchContent()).rejects.toThrow(
      "Content API returned an invalid response. Start the Vite dev server with `pnpm start` and open http://localhost:8080 so `/api/content` is available."
    );
  });

  describe("error parsing on failed fetch (!response.ok)", () => {
    it("should parse nested error.message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValueOnce({
          error: { message: "Nested error message" },
        }),
      });

      await expect(fetchContent()).rejects.toThrow(
        "Nested error message"
      );
    });

    it("should parse nested error.failureType", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValueOnce({
          error: { failureType: "Nested failure type" },
        }),
      });

      await expect(fetchContent()).rejects.toThrow(
        "Nested failure type"
      );
    });

    it("should parse nested error.code", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValueOnce({
          error: { code: "NESTED_ERROR_CODE" },
        }),
      });

      await expect(fetchContent()).rejects.toThrow(
        "NESTED_ERROR_CODE"
      );
    });

    it("should parse top-level message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValueOnce({
          message: "Top level message",
        }),
      });

      await expect(fetchContent()).rejects.toThrow(
        "Top level message"
      );
    });

    it("should fallback to statusText if payload format is unknown", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Fallback Status Text",
        json: jest.fn().mockResolvedValueOnce({
          unknownFormat: "something",
        }),
      });

      await expect(fetchContent()).rejects.toThrow(
        "Fallback Status Text"
      );
    });

    it("should fallback to statusText if json parsing fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "JSON Parse Error Status Text",
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(fetchContent()).rejects.toThrow(
        "JSON Parse Error Status Text"
      );
    });
  });
});
