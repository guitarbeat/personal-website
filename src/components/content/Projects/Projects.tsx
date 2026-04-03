import { useCallback, useEffect, useMemo, useState } from "react";
// import { withGoogleSheets } from "react-db-google-sheets";
import { useNotion } from "../../../contexts/NotionContext";
import type { ProjectItem } from "../../../types/content";
import { generateTagColors } from "../../../utils/colorUtils";
import { clamp, cn } from "../../../utils/commonUtils";
// import { processProjectsData } from "../../../utils/googleSheetsUtils";
import PixelCanvas from "../../effects/PixelCanvas/PixelCanvas";

const DEFAULT_PROJECT_EFFECT = {
  colors: ["#f8fafc", "#cbd5f5", "#94a3b8"],
  gap: 9,
  speed: 24,
};

const parseHsl = (color: string | undefined) => {
  if (typeof color !== "string") {
    return null;
  }

  const match = color
    .replace(/\s+/g, "")
    .match(/^hsl\(([-\d.]+),([-\d.]+)%,([-\d.]+)%\)$/i);

  if (!match) {
    return null;
  }

  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  };
};

const createPaletteFromHsl = (color: string | undefined) => {
  const parsed = parseHsl(color);

  if (!parsed) {
    return DEFAULT_PROJECT_EFFECT.colors;
  }

  const { h, s, l } = parsed;
  const accent = `hsl(${h}, ${clamp(s + 12, 0, 100)}%, ${clamp(l + 18, 0, 96)}%)`;
  const base = `hsl(${h}, ${clamp(s + 6, 0, 100)}%, ${clamp(l + 6, 0, 96)}%)`;
  const shadow = `hsl(${h}, ${clamp(s + 4, 0, 100)}%, ${clamp(l - 10, 4, 92)}%)`;

  return [accent, base, shadow];
};

const createProjectEffect = (tagColor: string | undefined, index: number) => {
  const palette = createPaletteFromHsl(tagColor);

  return {
    colors: palette,
    gap: 8 + (index % 3) * 2,
    speed: 18 + (index % 4) * 3,
  };
};

interface ProjectCardProps {
  title: string;
  hook: string;
  detail: string;
  slug: string;
  link?: string | null;
  keywords: string[];
  date: string | number | null;
  image?: string | null;
  tagColors?: Record<string, string>;
  primaryTagColor?: string;
  className?: string;
  effect?: { colors: string[]; gap: number; speed: number };
}

function ProjectCard({
  title,
  hook,
  detail,
  slug,
  link,
  keywords,
  date,
  image,
  tagColors,
  primaryTagColor,
  className = "",
  effect = DEFAULT_PROJECT_EFFECT,
}: ProjectCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isClicked) {
      e.preventDefault();
      setIsClicked(true);
    }
  };

  const _link = link ? (
    <div className="projects__card__label projects__card__link">Link</div>
  ) : null;

  return (
    <a
      href={link || undefined}
      target={link ? "_blank" : undefined}
      rel={link ? "noreferrer" : undefined}
      className={cn(`projects__card ${className}`.trim(), image && "has-image")}
      key={slug}
      onClick={handleClick}
    >
      <PixelCanvas
        className="projects__card__pixel-canvas"
        colors={effect.colors}
        gap={effect.gap}
        speed={effect.speed}
      />
      <div className="projects__card__content">
        <div className="projects__card__keywords">
          {_link}
          {keywords.map((keyword) => (
            <div
              key={keyword}
              className="projects__card__label"
              style={{
                backgroundColor:
                  tagColors?.[keyword] ||
                  primaryTagColor ||
                  "rgba(255, 255, 255, 0.25)",
                mixBlendMode: "multiply",
                filter: "contrast(1.1) brightness(1.1)",
              }}
            >
              {keyword}
            </div>
          ))}
        </div>
        <h3>{title}</h3>
        <p className="projects__card__hook">{hook}</p>
        <p
          className={cn("date", isClicked ? "show-text" : "")}
          style={{ fontStyle: "italic", color: "var(--color-sage-light)" }}
        >
          {date ?? ""}
        </p>
        <p className={cn("projects__card__detail", isClicked ? "show-text" : "")}>
          {detail}
        </p>
        {image && <img src={image} className="project-image" alt="Project" />}
      </div>
    </a>
  );
}
interface ProjectsProps {
  db?: {
    projects: ProjectItem[];
  };
}

function Projects({ db: propsDb }: ProjectsProps = {}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const { db: contextDb } = useNotion();

  const db = propsDb || contextDb;

  const projectsData = useMemo(
    () => (Array.isArray(db?.projects) ? db.projects : []),
    [db?.projects],
  );
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

  useEffect(() => {
    const generatedTagColors = generateTagColors(allKeywords);
    setTagColors(generatedTagColors);
    setActiveFilters((prevFilters) => {
      if (prevFilters.length === 0) {
        return allKeywords;
      }

      const filtered = prevFilters.filter((filter) =>
        allKeywords.includes(filter),
      );

      if (filtered.length === 0) {
        return allKeywords;
      }

      return filtered;
    });
  }, [allKeywords]);

  // Add theme change listener
  useEffect(() => {
    const handleThemeChange = () => {
      const regeneratedTagColors = generateTagColors(allKeywords);
      setTagColors(regeneratedTagColors);
      setActiveFilters((prevFilters) => {
        if (prevFilters.length === 0) {
          return allKeywords;
        }

        const filtered = prevFilters.filter((filter) =>
          allKeywords.includes(filter),
        );

        if (filtered.length === 0) {
          return allKeywords;
        }

        return filtered;
      });
    };

    // Listen for theme changes
    document.body.addEventListener("theme-changed", handleThemeChange);

    return () => {
      document.body.removeEventListener("theme-changed", handleThemeChange);
    };
  }, [allKeywords]);

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

  const project_cards = projectsData.map((projectProps, index) => {
    const primaryKeyword = projectProps.keywords[0] || "";
    const primaryTagColor = tagColors[primaryKeyword];
    const isFiltered =
      projectProps.keywords.length > 0 &&
      !projectProps.keywords.some((keyword) => activeFilters.includes(keyword));
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
        <h1>Some of my Projects</h1>
        <div className="filter-buttons">
          {allKeywords.map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={cn("tag", activeFilters.includes(filter) && "active")}
              style={
                {
                  "--tag-color": activeFilters.includes(filter)
                    ? tagColors[filter]
                    : undefined,
                } as React.CSSProperties
              }
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="projects">
          <div className="projects__cards_container">{project_cards}</div>
        </div>
      </div>
    </div>
  );
}

export default Projects;
