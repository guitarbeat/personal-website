import moment from "moment";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import { useNotionSectionData } from "../../../hooks/useNotionSectionData";
import type { NotionData, WorkItem } from "../../../types/content";
import { cn } from "../../../utils/commonUtils";
import { formatWorkDuration } from "../../../utils/formatWorkDuration";
import {
  WORK_CARD_EFFECTS,
  type MoireEffectPreset,
} from "../../../utils/moireEffectPresets";
import PixelCanvas from "../../effects/PixelCanvas/PixelCanvas";
import { NotionSectionSkeleton } from "../shared/NotionSectionSkeleton";

interface Job {
  slug: string;
  title: string;
  company: string;
  place: string;
  from: string;
  to: string;
  _from: moment.Moment;
  _to: moment.Moment;
  date: string;
  duration: number;
  bar_start: number;
  bar_height: number;
  description: string;
}

interface TimelineBarProps {
  first_year: string;
  job_bars: number[][];
  activeCards: Set<string>;
  hoveredJob: Job | undefined;
  jobs: Job[];
}

// Function for TimelineBar component
function TimelineBar({
  first_year,
  job_bars,
  activeCards,
  hoveredJob,
  jobs,
}: TimelineBarProps) {
  const sub_bars = job_bars.map(([height, start]) => (
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
      {hoveredJob && (
        <div
          className="work__timeline__duration"
          style={{
            bottom: `${hoveredJob.bar_start + hoveredJob.bar_height / 2}%`,
            visibility: hoveredJob ? "visible" : "hidden",
          }}
        >
          {formatWorkDuration(hoveredJob.duration)}
        </div>
      )}
      <p className="work__timeline__start">{first_year}</p>

      {sub_bars}
      {Array.from(activeCards).map((slug) => {
        const activeJob = jobsBySlug.get(slug);
        return (
          activeJob && (
            <div
              key={slug}
              className="work__timeline__bar"
              style={{
                height: `${activeJob.bar_height}%`,
                bottom: `${activeJob.bar_start}%`,
              }}
            />
          )
        );
      })}
    </div>
  );
}

const MemoizedTimelineBar = React.memo(TimelineBar);

// Standalone helper function to process job data
const processJobsData = (rawJobs: WorkItem[]) => {
  const jobs: Job[] = rawJobs.map((job) => ({
    ...job,
    to: job.to ?? "",
    _from: moment(),
    _to: moment(),
    date: "",
    duration: 0,
    bar_start: 0,
    bar_height: 0,
  }));

  let first_date = moment();

  for (const job of jobs) {
    const _to_moment = job.to ? moment(job.to, "MM-YYYY") : moment();
    const _from_moment = moment(job.from, "MM-YYYY");
    const _duration = _to_moment.diff(_from_moment, "months");

    job.from = _from_moment.format("MMM YYYY");
    job.to = job.to ? _to_moment.format("MMM YYYY") : "Now";
    job._from = _from_moment;
    job._to = _to_moment;
    job.date = _duration === 0 ? job.from : `${job.from} - ${job.to}`;
    job.duration = _duration === 0 ? 1 : _duration;

    if (first_date.diff(_from_moment) > 0) {
      first_date = _from_moment;
    }
  }

  const time_span = moment().diff(first_date, "months");
  const safe_time_span = time_span === 0 ? 1 : time_span;

  const job_bars = new Array(jobs.length);
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    job.bar_start =
      (100 * job._from.diff(first_date, "months")) / safe_time_span;
    job.bar_height = (100 * job.duration) / safe_time_span;
    job_bars[i] = [job.bar_height, job.bar_start];
  }

  return { jobs, first_date, job_bars };
};

interface WorkProps {
  db?: Pick<NotionData, "work">;
}

// Function for Work component
function Work({ db: propsDb }: WorkProps = {}) {
  // State management
  const [activeCards, setActiveCards] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null); // Add missing state
  const { db, isLoading } = useNotionSectionData(propsDb);

  const handleCardClick = useCallback((slug: string) => {
    setActiveCards((prev) => {
      const newSet = new Set(prev); // Create a new Set to avoid mutating state directly
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

  // Data processing
  const { jobs, first_date, job_bars } = useMemo(
    () => processJobsData(db?.work || []),
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
                first_year={first_date.format("YYYY")}
                job_bars={job_bars}
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
