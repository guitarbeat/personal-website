import type { NotionData } from "../contexts/NotionContext";

// Define the shape of the Notion response if needed, otherwise use any[] for now due to complex structure

// Fetch data from a Notion database via Vercel serverless function
// biome-ignore lint/suspicious/noExplicitAny: Notion data structure
const fetchNotionDatabase = async (databaseType: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `/api/notion?type=${databaseType}&filter=true&sorts=true`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Serverless function returns already-transformed data as an array
    return Array.isArray(data) ? data : [];
    // biome-ignore lint/suspicious/noExplicitAny: Error handling
  } catch (error: any) {
    console.error(`Error fetching ${databaseType} from Notion:`, error);
    return [];
  }
};

// Data is already transformed by serverless function, just pass through
// biome-ignore lint/suspicious/noExplicitAny: Data transform
const transformProjectsData = (data: any[]): any[] => {
  return data;
};

// Data is already transformed by serverless function, just pass through
// biome-ignore lint/suspicious/noExplicitAny: Data transform
const transformWorkData = (data: any[]): any[] => {
  return data;
};

// Data is already transformed by serverless function, just pass through
// biome-ignore lint/suspicious/noExplicitAny: Data transform
const transformAboutData = (data: any[]): any[] => {
  return data;
};

export const notionService = {
  getProjects: () =>
    fetchNotionDatabase("projects").then(transformProjectsData),
  getWork: () => fetchNotionDatabase("work").then(transformWorkData),
  getAbout: () => fetchNotionDatabase("about").then(transformAboutData),
  getAllData: async (): Promise<NotionData> => {
    const [projects, work, about] = await Promise.all([
      fetchNotionDatabase("projects").then(transformProjectsData),
      fetchNotionDatabase("work").then(transformWorkData),
      fetchNotionDatabase("about").then(transformAboutData),
    ]);

    return {
      projects,
      work,
      about,
    };
  },
};
