import { useState } from "react";
import { cn } from "@/utils/commonUtils";
import {
  DEFAULT_PROJECT_EFFECT,
  type MoireEffectPreset,
} from "@/utils/moireEffectPresets";
import PixelCanvas from "../../effects/PixelCanvas/PixelCanvas";

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
  effect?: MoireEffectPreset;
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
      className={cn(
        `projects__card ${className}`.trim(),
        image && "has-image",
        isClicked && "is-expanded",
      )}
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
        <div className="projects__card__meta">
          <p className="projects__card__year">{date ?? ""}</p>
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
                }}
              >
                {keyword}
              </div>
            ))}
          </div>
        </div>
        <h3>{title}</h3>
        <p className="projects__card__hook">{hook}</p>
        <div
          className={cn(
            "projects__card__detail-wrapper",
            isClicked && "show-text",
          )}
        >
          <div className="projects__card__detail-inner">
            <p className="projects__card__detail">{detail}</p>
          </div>
        </div>
        {image && (
          <img
            src={image}
            className="project-image"
            alt="Project"
            width={16}
            height={9}
          />
        )}
      </div>
    </a>
  );
}

export default ProjectCard;
