import { useNotion } from "../contexts/NotionContext";
import type { NotionData } from "../types/content";

export function useNotionSectionData(propsDb?: Partial<NotionData>) {
  const { db: contextDb, loading } = useNotion();
  const db = propsDb ?? contextDb;
  const isLoading = loading && propsDb === undefined;

  return { db, isLoading };
}
