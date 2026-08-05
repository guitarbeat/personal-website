import { useMemo } from "react";
import { useNotionSectionData } from "@/hooks/useNotionSectionData";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import type { NotionData } from "@/types/content";
import { cn } from "@/utils/commonUtils";
import { createProjectEffect } from "@/utils/moireEffectPresets";
import { NotionSectionSkeleton } from "../shared/NotionSectionSkeleton";
import ProjectCard from "./ProjectCard";

interface ProjectsProps {
  db?: Pick<NotionData, "projects">;
}

function Projects({ db: propsDb }: ProjectsProps = {}) {
  const { db, isLoading } = useNotionSectionData(propsDb);

  const projectsData = useMemo(
    () => (Array.isArray(db?.projects) ? db.projects : []),
    [db?.projects],
  );
  const { allKeywords, tagColors, activeFiltersSet, toggleFilter } =
    useProjectFilters(projectsData);

  const project_cards = projectsData.map((projectProps, index) => {
    const primaryKeyword = projectProps.keywords[0] || "";
    const primaryTagColor = tagColors[primaryKeyword];
    const isFiltered =
      projectProps.keywords.length > 0 &&
      !projectProps.keywords.some((keyword) => activeFiltersSet.has(keyword));
    const effect = createProjectEffect(primaryTagColor, index);

    return (
      <ProjectCard
        key={projectProps.slug}
        {...projectProps}
        tagColors={tagColors}
        primaryTagColor={primaryTagColor}
        className={isFiltered ? "filtered-out" : ""}
        effect={effect}
      />
    );
  });

  return (
    <div className="container" id="projects">
      <div className="container__content">
        <div className="projects-header">
          <h1>Some of my Projects</h1>
          <div className="filter-buttons" aria-busy={isLoading}>
            {isLoading ? (
              <NotionSectionSkeleton section="project-filters" />
            ) : (
              allKeywords.map((filter) => {
                const isActive = activeFiltersSet.has(filter);
                return (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className={cn("tag", isActive && "active")}
                    aria-pressed={isActive}
                    style={
                      {
                        "--tag-color": tagColors[filter],
                      } as React.CSSProperties
                    }
                  >
                    {filter}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="projects">
          <div className="projects__cards_container">
            {isLoading ? (
              <NotionSectionSkeleton section="projects" />
            ) : (
              project_cards
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Projects;
