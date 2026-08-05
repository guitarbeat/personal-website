import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectItem } from "@/types/content";
import { generateTagColors } from "@/utils/colorUtils";
import { reconcileProjectFilters } from "@/utils/reconcileProjectFilters";

export function useProjectFilters(projectsData: ProjectItem[]) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});

  const allKeywords = useMemo(
    () =>
      Array.from(
        new Set(
          projectsData.flatMap((project) =>
            Array.isArray(project.keywords) ? project.keywords : [],
          ),
        ),
      ).filter(
        (keyword): keyword is string =>
          typeof keyword === "string" && keyword.trim().length > 0,
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
    allKeywords,
    tagColors,
    activeFiltersSet,
    toggleFilter,
  };
}
