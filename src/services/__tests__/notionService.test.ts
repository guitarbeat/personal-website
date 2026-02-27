import NotionService from '../notionService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NotionService', () => {
  let notionService: NotionService;

  beforeEach(() => {
    notionService = new NotionService();
    mockFetch.mockClear();
    // Reset process.env.REACT_APP_API_BASE if needed, but it defaults to "" in the file
  });

  it('should fetch projects correctly', async () => {
    const mockData = [{ id: 1, title: 'Project 1' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await notionService.getProjects();

    expect(mockFetch).toHaveBeenCalledWith('/api/notion?database=projects', {
      method: 'GET',
    });
    expect(result).toEqual(mockData);
  });

  it('should fetch work correctly', async () => {
    const mockData = [{ id: 1, company: 'Company A' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await notionService.getWork();

    expect(mockFetch).toHaveBeenCalledWith('/api/notion?database=work', {
      method: 'GET',
    });
    expect(result).toEqual(mockData);
  });

  it('should fetch about correctly', async () => {
    const mockData = [{ id: 1, description: 'About me' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await notionService.getAbout();

    expect(mockFetch).toHaveBeenCalledWith('/api/notion?database=about', {
      method: 'GET',
    });
    expect(result).toEqual(mockData);
  });

  it('should fetch all data correctly', async () => {
    const mockProjects = [{ id: 1, title: 'Project 1' }];
    const mockWork = [{ id: 1, company: 'Company A' }];
    const mockAbout = [{ id: 1, description: 'About me' }];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProjects })
      .mockResolvedValueOnce({ ok: true, json: async () => mockWork })
      .mockResolvedValueOnce({ ok: true, json: async () => mockAbout });

    const result = await notionService.getAllData();

    expect(result).toEqual({
      projects: mockProjects,
      work: mockWork,
      about: mockAbout,
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'API Error' }),
    });

    const result = await notionService.getProjects();

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
