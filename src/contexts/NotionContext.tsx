import { createContext, useContext, useEffect, useState } from "react";
import NotionService from "../services/notionService";
import type { ContentMeta, NotionData } from "../types/content";

const EMPTY_DATA: NotionData = {
  projects: [],
  work: [],
  about: [],
};

export interface NotionContextType {
  db: NotionData;
  meta: ContentMeta | null;
  loading: boolean;
  error: string | null;
  isDegraded: boolean;
  lastUpdated: string | null;
}

const NotionContext = createContext<NotionContextType | null>(null);

export const useNotion = () => {
  const context = useContext(NotionContext);
  if (!context) {
    throw new Error("useNotion must be used within NotionProvider");
  }
  return context;
};

export const NotionProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<NotionData>(EMPTY_DATA);
  const [meta, setMeta] = useState<ContentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const notionService = new NotionService();
        const content = await notionService.getAllData();

        if (!isMounted) {
          return;
        }

        setData(content.data);
        setMeta(content.meta);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Failed to load content.";

        console.error("Error fetching Notion data:", err);
        setData(EMPTY_DATA);
        setMeta(null);
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: NotionContextType = {
    db: data,
    meta,
    loading,
    error,
    isDegraded: meta?.degraded ?? false,
    lastUpdated: meta?.snapshotUpdatedAt || meta?.fetchedAt || null,
  };

  return (
    <NotionContext.Provider value={value}>{children}</NotionContext.Provider>
  );
};
