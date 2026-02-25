import NotionService from "../notionService";

// Mock global fetch
const mockFetch = jest.spyOn(global, "fetch");
// Mock console.error to avoid polluting test output
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("NotionService", () => {
  let notionService: NotionService;

  beforeEach(() => {
    notionService = new NotionService();
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockFetch.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("getProjects", () => {
    it("should return an array of projects on success", async () => {
      const mockProjects = [{ id: 1, name: "Project 1" }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      } as Response);

      const result = await notionService.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/notion?database=projects"),
        {
          method: "GET",
        },
      );
      expect(result).toEqual(mockProjects);
    });

    it("should return an empty array and log error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      } as Response);

      const result = await notionService.getProjects();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching projects from Notion:"),
        expect.any(Error),
      );
    });

    it("should return an empty array on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network Error"));

      const result = await notionService.getProjects();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching projects from Notion:"),
        expect.any(Error),
      );
    });

    it("should return an empty array if data is not an array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ not: "an array" }),
      } as Response);

      const result = await notionService.getProjects();
      expect(result).toEqual([]);
    });
  });

  describe("getWork", () => {
    it("should return an array of work items on success", async () => {
      const mockWork = [{ id: 1, company: "Company A" }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWork,
      } as Response);

      const result = await notionService.getWork();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/notion?database=work"),
        {
          method: "GET",
        },
      );
      expect(result).toEqual(mockWork);
    });
  });

  describe("getAbout", () => {
    it("should return an array of about items on success", async () => {
      const mockAbout = [{ id: 1, text: "About Me" }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAbout,
      } as Response);

      const result = await notionService.getAbout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/notion?database=about"),
        {
          method: "GET",
        },
      );
      expect(result).toEqual(mockAbout);
    });
  });

  describe("getAllData", () => {
    it("should return aggregated data from all endpoints", async () => {
      const mockProjects = [{ id: 1, name: "Project 1" }];
      const mockWork = [{ id: 1, company: "Company A" }];
      const mockAbout = [{ id: 1, text: "About Me" }];

      // Mock consecutive calls. Note: The order depends on Promise.all execution order which is usually simultaneous but response order is mocked.
      // Since Promise.all fires them all, we need to mock based on the calls.
      // However, mockResolvedValueOnce queues responses. The order of await inside Promise.all is determined by the array order, but fetch calls happen almost instantly.
      // To be safe, we can inspect the URL in the mock implementation if needed, but simple queueing usually works if calls are deterministic.
      // NotionService calls them in this order in Promise.all: [getProjects, getWork, getAbout]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProjects,
        } as Response) // projects
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWork,
        } as Response) // work
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAbout,
        } as Response); // about

      const result = await notionService.getAllData();

      expect(result).toEqual({
        projects: mockProjects,
        work: mockWork,
        about: mockAbout,
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
