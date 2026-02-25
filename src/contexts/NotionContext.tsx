import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import NotionService from "../services/notionService";

interface NotionData {
  // biome-ignore lint/suspicious/noExplicitAny: Data is dynamic
  projects: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Data is dynamic
  work: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Data is dynamic
  about: any[];
}

interface NotionContextType {
  data: NotionData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const NotionContext = createContext<NotionContextType | null>(null);

export const NotionProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<NotionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notionService = useMemo(() => new NotionService(), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allData = await notionService.getAllData();
      // biome-ignore lint/suspicious/noExplicitAny: Data structure matching
      setData(allData as any);
    } catch (err: unknown) {
      console.error("Error fetching Notion data:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [notionService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contextValue = useMemo(
    () => ({
      data,
      loading,
      error,
      refreshData: fetchData,
    }),
    [data, loading, error, fetchData],
  );

  return (
    <NotionContext.Provider value={contextValue}>
      {children}
    </NotionContext.Provider>
  );
};

export const useNotion = () => {
  const context = useContext(NotionContext);
  if (!context) {
    throw new Error("useNotion must be used within a NotionProvider");
  }
  return context;
};
