import React, { useCallback, useMemo, useState } from "react";
import { NotionSectionSkeleton } from "@/components/content/shared/NotionSectionSkeleton";
import PixelCanvas from "@/components/effects/PixelCanvas/PixelCanvas";
import { useNotionSectionData } from "@/hooks/useNotionSectionData";
import type { NotionData } from "@/types/content";
import { cn } from "@/utils/commonUtils";
import { formatWorkDuration } from "@/utils/formatWorkDuration";
import {
  type MoireEffectPreset,
  WORK_CARD_EFFECTS,
} from "@/utils/moireEffectPresets";
import { formatWorkYear, processWorkTimeline } from "@/utils/workTimeline";

interface TimelineBarProps {
  firstYear: string;
  jobBars: number[][];
  activeCards: Set<string>;
  hoveredJob: ProcessedWorkJob | undefined;
  jobs: ProcessedWorkJob[];
}

function TimelineBar({
  firstYear,
  jobBars,
  activeCards,
  hoveredJob,
  jobs,
}: TimelineBarProps) {
  const subBars = jobBars.map(([height, start]) => (
    <div
      key={`${height}-${start}`}
      className="work__timeline__subbar"
      style={{ height: `${height}%`, bottom: `${start}%` }}
    />
  ));

  const jobsBySlug = new Map(jobs.map((job) => [job.slug, job]));

  return (
    <div className="work__timeline">
      <p className="work__timeline__now">Now</p>
      {hoveredJob ? (
        <div
          className="work__timeline__duration"
          style={{
            bottom: `${hoveredJob.bar_start + hoveredJob.bar_height / 2}%`,
          }}
        >
          {formatWorkDuration(hoveredJob.duration)}
        </div>
      ) : null}
      <p className="work__timeline__start">{firstYear}</p>

      {subBars}
      {Array.from(activeCards).map((slug) => {
        const activeJob = jobsBySlug.get(slug);
        return activeJob ? (
          <div
            key={slug}
            className="work__timeline__bar"
            style={{
              height: `${activeJob.bar_height}%`,
              bottom: `${activeJob.bar_start}%`,
            }}
          />
        ) : null;
      })}
    </div>
  );
}

const MemoizedTimelineBar = React.memo(TimelineBar);

interface WorkProps {
  db?: Pick<NotionData, "work">;
}

function Work({ db: propsDb }: WorkProps = {}) {
  const [activeCards, setActiveCards] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { db, isLoading } = useNotionSectionData(propsDb);

  const handleCardClick = useCallback((slug: string) => {
    setActiveCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  }, []);

  const handleCardHover = useCallback((slug: string | null) => {
    setHoveredCard(slug);
  }, []);

  const { jobs, firstDate, jobBars } = useMemo(
    () => processWorkTimeline(db?.work ?? []),
    [db?.work],
  );

  return (
    <div className="container" id="work">
      <div className="container__content">
        <h1>My career so far</h1>
        <div className="work" aria-busy={isLoading} aria-live="polite">
          {isLoading ? (
            <NotionSectionSkeleton section="work" />
          ) : (
            <>
              <MemoizedTimelineBar
                firstYear={formatWorkYear(firstDate)}
                jobBars={jobBars}
                activeCards={activeCards}
                hoveredJob={jobs.find((job) => job.slug === hoveredCard)}
                jobs={jobs}
              />
              <div className="work__items">
                {jobs.map((job, index) => {
                  const isActive = activeCards.has(job.slug);
                  const effect: MoireEffectPreset =
                    WORK_CARD_EFFECTS[index % WORK_CARD_EFFECTS.length];
                  return (
                    <button
                      key={job.slug}
                      type="button"
                      className={cn("work__item", isActive && "active")}
                      onClick={() => handleCardClick(job.slug)}
                      onMouseEnter={() => handleCardHover(job.slug)}
                      onMouseLeave={() => handleCardHover(null)}
                      aria-expanded={isActive}
                    >
                      <PixelCanvas
                        className="work__item__pixel-canvas"
                        colors={effect.colors}
                        gap={effect.gap}
                        speed={effect.speed}
                        noFocus={effect.noFocus}
                      />
                      <div className="work__item__content">
                        <p
                          className={`work__item__place ${
                            isActive ? "show-text" : ""
                          }`}
                        >
                          <i className="fa fa-map-marker-alt" /> {job.place}
                        </p>
                        <h2>{job.title}</h2>
                        <h3 className="company-name">{job.company}</h3>
                        <p
                          className={`work__item__date ${
                            isActive ? "show-text" : ""
                          }`}
                        >
                          {job.date}
                        </p>
                        <p className={cn("", isActive ? "show-text" : "")}>
                          {job.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Work;
