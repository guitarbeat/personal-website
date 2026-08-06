import NotionService from "./notionService";

describe("NotionService", () => {
  let service: NotionService;

  beforeEach(() => {
    service = new NotionService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getAllData", () => {
    it("fetches content successfully", async () => {
      const mockData = {
        data: [],
        meta: {}
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.getAllData();
      expect(result).toEqual(mockData);
    });

    it("throws a parsed error when response is not ok and JSON has an error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ message: "Custom API Error" }),
      });

      await expect(service.getAllData()).rejects.toThrow("Custom API Error");
    });

    it("throws a parsed error when response is not ok and JSON has a nested error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ error: { message: "Nested Error Message" } }),
      });

      await expect(service.getAllData()).rejects.toThrow("Nested Error Message");
    });

    it("throws a fallback error when .json() throws and response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(service.getAllData()).rejects.toThrow("Internal Server Error");
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/content"), { method: "GET" });
    });

    it("throws an error when response is ok but payload is invalid", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.getAllData()).rejects.toThrow(/Content API returned an invalid response/);
    });
  });
});
