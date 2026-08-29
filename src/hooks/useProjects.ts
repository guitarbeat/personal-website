import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotionData } from "@/types/content";
import { generateTagColors } from "@/utils/colorUtils";
import { reconcileProjectFilters } from "@/utils/reconcileProjectFilters";
import { useNotionSectionData } from "./useNotionSectionData";

export interface UseProjectsOptions {
  db?: Pick<NotionData, "projects">;
}

export function useProjects({ db: propsDb }: UseProjectsOptions = {}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const { db, isLoading } = useNotionSectionData(propsDb);

  const projectsData = useMemo(
    () => (Array.isArray(db?.projects) ? db.projects : []),
    [db?.projects],
  );

  const allKeywords = useMemo(
    () =>
      Array.from(
        projectsData.reduce<Set<string>>((acc, project) => {
          if (Array.isArray(project.keywords)) {
            for (const keyword of project.keywords) {
              if (typeof keyword === "string" && keyword.trim().length > 0) {
                acc.add(keyword);
              }
            }
          }
          return acc;
        }, new Set()),
      ),
    [projectsData],
  );

  const syncTagColors = useCallback(() => {
    setTagColors(generateTagColors(allKeywords));
  }, [allKeywords]);

  const syncFilters = useCallback(() => {
    setActiveFilters((prevFilters) =>
      reconcileProjectFilters(prevFilters, allKeywords),
    );
  }, [allKeywords]);

  useEffect(() => {
    syncTagColors();
    syncFilters();
  }, [syncTagColors, syncFilters]);

  useEffect(() => {
    document.body.addEventListener("theme-changed", syncTagColors);

    return () => {
      document.body.removeEventListener("theme-changed", syncTagColors);
    };
  }, [syncTagColors]);

  const toggleFilter = useCallback(
    (filter: string) => {
      setActiveFilters((prevFilters) => {
        if (prevFilters.includes(filter)) {
          if (prevFilters.length === 1) {
            return [...allKeywords];
          }
          return prevFilters.filter((f) => f !== filter);
        }

        return [...prevFilters, filter];
      });
    },
    [allKeywords],
  );

  const activeFiltersSet = useMemo(
    () => new Set(activeFilters),
    [activeFilters],
  );

  return {
    projectsData,
    allKeywords,
    activeFilters,
    activeFiltersSet,
    tagColors,
    isLoading,
    toggleFilter,
  };
}
