import { cn } from "../../../utils/commonUtils";
import {
  ABOUT_SKELETON_KEYS,
  PROJECT_FILTER_SKELETON_KEYS,
  PROJECTS_SKELETON_KEYS,
  WORK_SKELETON_KEYS,
} from "./contentSkeletonConstants";
import { SkeletonBlock } from "./SkeletonBlock";

export type NotionSkeletonSection =
  | "about"
  | "project-filters"
  | "projects"
  | "work";

interface NotionSectionSkeletonProps {
  section: NotionSkeletonSection;
  className?: string;
}

export function NotionSectionSkeleton({
  section,
  className,
}: NotionSectionSkeletonProps) {
  switch (section) {
    case "about":
      return (
        <>
          {ABOUT_SKELETON_KEYS.map((skeletonKey) => (
            <div
              key={skeletonKey}
              className={cn("about-me__text about-me__text--skeleton", className)}
              aria-hidden="true"
            >
              <div className="text-background">
                <SkeletonBlock className="about-me__skeleton-title" />
              </div>
            </div>
          ))}
        </>
      );

    case "project-filters":
      return (
        <>
          {PROJECT_FILTER_SKELETON_KEYS.map((skeletonKey) => (
            <SkeletonBlock
              key={skeletonKey}
              variant="button"
              className={cn("tag tag--skeleton", className)}
            />
          ))}
        </>
      );

    case "projects":
      return (
        <>
          {PROJECTS_SKELETON_KEYS.map((skeletonKey) => (
            <div
              key={skeletonKey}
              className={cn("projects__card projects__card--skeleton", className)}
            >
              <div className="projects__card__content">
                <SkeletonBlock className="projects__skeleton-meta" />
                <SkeletonBlock className="projects__skeleton-title" />
                <SkeletonBlock className="projects__skeleton-hook" />
                <SkeletonBlock className="projects__skeleton-detail" />
              </div>
            </div>
          ))}
        </>
      );

    case "work":
      return (
        <div aria-hidden="true">
          <div className={cn("work__timeline work__timeline--skeleton", className)}>
            <SkeletonBlock className="work__skeleton-bar" variant="card" />
          </div>
          <div className="work__items">
            {WORK_SKELETON_KEYS.map((skeletonKey) => (
              <div
                key={skeletonKey}
                className="work__item work__item--skeleton"
              >
                <div className="work__item__content">
                  <SkeletonBlock className="work__skeleton-title" />
                  <SkeletonBlock className="work__skeleton-company" />
                  <SkeletonBlock className="work__skeleton-date" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
