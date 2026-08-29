// About section content component for the personal website.

import { useCallback, useMemo, useState } from "react";
import { useNotionSectionData } from "@/hooks/useNotionSectionData";
import { useSpotifyWidget } from "@/hooks/useSpotifyWidget";
import { cn } from "@/utils/commonUtils";
import shell from "../../../assets/images/shell.png";
import {
  SPOTIFY_WIDGET_HEIGHT,
  SPOTIFY_WIDGET_WIDTH,
} from "../shared/contentSkeletonConstants";
import { NotionSectionSkeleton } from "../shared/NotionSectionSkeleton";

const SHELL_IMAGE_WIDTH = 1957;
const SHELL_IMAGE_HEIGHT = 2400;

const SPOTIFY_PROFILE_URL =
  "https://spotify-github-profile.kittinanx.com/api/view.svg?uid=31skxfoaghlkljkdiluds3g3decy&redirect=true";
// Widget template uses `#{{background_color}}`; 8-digit hex gives a transparent fill.
const SPOTIFY_IMAGE_URL =
  "https://spotify-github-profile.kittinanx.com/api/view.svg?uid=31skxfoaghlkljkdiluds3g3decy&cover_image=true&theme=default&show_offline=true&background_color=00000000&interchange=true&bar_color=53b14f&bar_color_cover=true";

export function ColorChangeOnHover({ text = "" }) {
  const content = useMemo(() => {
    const words = text.split(/\s+/).filter(Boolean);
    const wordOccurrences = new Map();

    return words.map((word) => {
      const occurrence = (wordOccurrences.get(word) ?? 0) + 1;
      wordOccurrences.set(word, occurrence);

      return (
        <span key={`${word}-${occurrence}`} className="hover-color-change">
          {word}{" "}
        </span>
      );
    });
  }, [text]);

  return <>{content}</>;
}

function SpotifyWidget() {
  const { handleSpotifyClick } = useSpotifyWidget();

  return (
    <a
      className="about-me__spotify"
      href={SPOTIFY_PROFILE_URL}
      onClick={handleSpotifyClick}
      aria-label="View Spotify profile"
    >
      <img
        src={SPOTIFY_IMAGE_URL}
        alt="Spotify GitHub profile"
        width={SPOTIFY_WIDGET_WIDTH}
        height={SPOTIFY_WIDGET_HEIGHT}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}

interface AboutTextItemProps {
  category: string;
  description: string;
  isExpanded: boolean;
  onClick: (category: string) => void;
}

function AboutTextItem({
  category,
  description,
  isExpanded,
  onClick,
}: AboutTextItemProps) {
  return (
    <button
      type="button"
      className={cn("about-me__text", isExpanded && "expanded")}
      onClick={() => onClick(category)}
    >
      <h2>{category}</h2>
      <div className="about-me__text-body">
        <div className="about-me__text-body-inner">
          <p>
            <ColorChangeOnHover text={description} />
          </p>
        </div>
      </div>
      <div className="expand-indicator" aria-hidden="true">
        {isExpanded ? "−" : "+"}
      </div>
    </button>
  );
}

function About() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { db, isLoading } = useNotionSectionData();

  const aboutTexts = db.about || [];

  const handleSectionClick = useCallback((category: string) => {
    setExpandedSection((prev) => (prev === category ? null : category));
  }, []);

  const renderAboutTexts = (
    texts: { category: string; description: string }[],
  ) =>
    texts.map(({ category, description }) => (
      <AboutTextItem
        key={category}
        category={category}
        description={description}
        isExpanded={expandedSection === category}
        onClick={handleSectionClick}
      />
    ));

  return (
    <div id="about" className="container">
      <div className="container__content">
        <div className="about-me">
          <h1>About Me</h1>
          <div
            className="about-me__content"
            aria-busy={isLoading}
            aria-live="polite"
          >
            <div className="about-me__text-container">
              {isLoading ? (
                <NotionSectionSkeleton section="about" />
              ) : (
                renderAboutTexts(aboutTexts)
              )}
            </div>
            <SpotifyWidget />
          </div>
          <div className="about-me__img">
            <img
              src={shell}
              alt=""
              width={SHELL_IMAGE_WIDTH}
              height={SHELL_IMAGE_HEIGHT}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
