// Notion Service - handles fetching data from Notion databases via Vercel serverless functions

// In production (Vercel), use relative paths which resolve to /api/*
// In development, can use local proxy server or Vercel dev server
const API_BASE = process.env.REACT_APP_API_BASE || "";

// Fetch data from a Notion database via Vercel serverless function
// biome-ignore lint/suspicious/noExplicitAny: Data is highly dynamic from Notion API
const fetchNotionDatabase = async (databaseType: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/notion?database=${databaseType}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Notion API error: ${error.message || response.statusText}`,
      );
    }

    const data = await response.json();
    // Serverless function returns already-transformed data as an array
    return Array.isArray(data) ? data : [];
    // biome-ignore lint/suspicious/noExplicitAny: Error shape varies from fetch operations
  } catch (error: any) {
    console.error(`Error fetching ${databaseType} from Notion:`, error);
    return [];
  }
};

// Main Notion Service class
class NotionService {
  async getProjects() {
    return fetchNotionDatabase("projects");
  }

  async getWork() {
    return fetchNotionDatabase("work");
  }

  async getAbout() {
    return fetchNotionDatabase("about");
  }

  async getAllData() {
    const [projects, work, about] = await Promise.all([
      this.getProjects(),
      this.getWork(),
      this.getAbout(),
    ]);

    return {
      projects,
      work,
      about,
    };
  }
}

export default NotionService;
