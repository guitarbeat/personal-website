import { useNotion } from "../contexts/NotionContext";
import type { NotionData } from "../types/content";

export function useNotionSectionData<TDb>(
  propsDb?: TDb,
) {
  const { db: contextDb, loading: notionLoading } = useNotion();
  const db = (propsDb ?? contextDb) as TDb extends undefined
    ? NotionData
    : NotionData & NonNullable<TDb>;
  const isLoading = notionLoading && propsDb === undefined;

  return { db, isLoading };
}
