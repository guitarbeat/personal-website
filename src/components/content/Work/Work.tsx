import type React from "react";
import { useContext, useEffect, useState } from "react";
import { withGoogleSheets } from "react-db-google-sheets";
import { useInView } from "react-intersection-observer";
import { NotionContext } from "../../../contexts/NotionContext";
import ErrorBoundary from "../../Core/ErrorBoundary";
import "./Work.scss";

// Utility for handling classes
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Types for Work component
interface Job {
  company: string;
  role: string;
  location: string;
  duration: string;
  description: string[];
  image: string;
  id: string;
  url?: string;
  color?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
}

interface WorkProps {
  db?: {
    // biome-ignore lint/suspicious/noExplicitAny: Generic data structure
    work: any[];
  };
}

// Function for Work component
function Work({ db: propsDb }: WorkProps = {}) {
  // State management
  const [activeCards, setActiveCards] = useState<Set<string>>(
    () => new Set<string>(),
  );

  // Context
  const {
    work: notionWork,
    error: notionError,
    loading: notionLoading,
  } = useContext(NotionContext);

  // Combine data sources - prefer Notion, fallback to props/Google Sheets
  const displayWork = notionWork.length > 0 ? notionWork : propsDb?.work || [];
  const isLoading = notionLoading && displayWork.length === 0;
  const hasError = !!notionError && displayWork.length === 0;

  // Data processing
  // Make a deep copy to avoid mutating the original data in context
  // biome-ignore lint/suspicious/noExplicitAny: Generic data structure
  const jobs: Job[] = ((displayWork as any[]) || []).map((job) => ({
    ...job,
  })) as Job[];

  // Effects
  useEffect(() => {
    // Initial animation delay
    const timer = setTimeout(() => {
      // Animation logic if needed
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleCard = (id: string) => {
    setActiveCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="work-loading">Loading work experience...</div>;
  }

  if (hasError) {
    return <div className="work-error">Error loading work experience.</div>;
  }

  return (
    <div className="work-container" id="work">
      <h2 className="section-title">Work Experience</h2>
      <div className="timeline">
        {jobs.map((job, index) => (
          <WorkCard
            key={job.id || index}
            job={job}
            isActive={activeCards.has(job.id)}
            onToggle={() => toggleCard(job.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Subcomponent for individual work cards
interface WorkCardProps {
  job: Job;
  isActive: boolean;
  onToggle: () => void;
  index: number;
}

const WorkCard = ({ job, isActive, onToggle, index }: WorkCardProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: Complex interactive card
    <div
      ref={ref}
      className={cn(
        "work-card",
        isActive ? "active" : "",
        inView ? "animate-in" : "",
      )}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      style={{ "--index": index } as React.CSSProperties}
    >
      <div className="work-card-header">
        <div className="company-info">
          <h3>{job.company}</h3>
          <h4>{job.role}</h4>
        </div>
        <div className="meta-info">
          <span className="duration">{job.duration}</span>
          <span className="location">{job.location}</span>
        </div>
      </div>

      <div
        className={cn("work-card-content", isActive ? "expanded" : "collapsed")}
      >
        <div className="description">
          {Array.isArray(job.description) ? (
            <ul>
              {job.description.map((desc, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static content
                <li key={i}>{desc}</li>
              ))}
            </ul>
          ) : (
            <p>{job.description}</p>
          )}
        </div>

        {job.technologies && (
          <div className="technologies">
            {job.technologies.map((tech) => (
              <span key={tech} className="tech-tag">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// biome-ignore lint/suspicious/noExplicitAny: HOC type mismatch
export default withGoogleSheets("work")(ErrorBoundary as any)(Work);
