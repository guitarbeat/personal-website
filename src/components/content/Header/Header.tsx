import PropTypes from "prop-types";
// Third-party imports
import React, { useCallback, useEffect, useRef, useState } from "react";

import cvFile from "../../../assets/documents/cv.pdf";

// Local imports
import { cn } from "../../../utils/commonUtils";
import {
  FALLBACK_PROFILE_SRC,
  PROFILE_IMAGE_HEIGHT,
  PROFILE_IMAGE_WIDTH,
  PROFILE_IMAGES,
  PROFILE_INDEX_STORAGE_KEY,
  readStoredProfileIndex,
} from "./headerProfileImages";
import useScrambleEffect from "./useScrambleEffect";

interface SocialMediaProps {
  keyword: string;
  icon?: string;
  link: string;
  tooltip: string;
  customIcon?: string;
}

function SocialMedia({
  keyword,
  icon,
  link,
  tooltip,
  customIcon,
}: SocialMediaProps) {
  return (
    <div className="social__icon tooltip">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={`tooltip-${keyword}`}
        aria-label={`Go to ${keyword}`}
      >
        {customIcon ? (
          <img
            src={customIcon}
            alt=""
            className="custom-icon"
            title={keyword}
            width={PROFILE_IMAGE_WIDTH}
            height={PROFILE_IMAGE_HEIGHT}
          />
        ) : (
          <span
            role="img"
            className={icon}
            title={keyword}
            aria-hidden="true"
          />
        )}
      </a>
      <span
        id={`tooltip-${keyword}`}
        className="tooltiptext tooltip-bottom"
        role="tooltip"
        aria-hidden="true"
      >
        {tooltip}
      </span>
    </div>
  );
}

SocialMedia.propTypes = {
  keyword: PropTypes.string.isRequired,
  icon: PropTypes.string,
  link: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  customIcon: PropTypes.string,
};

interface HeaderTextProps {
  type: "name" | "roles" | "title";
  items: string[];
  separator?: string;
}

const HeaderText = ({ type, items, separator }: HeaderTextProps) => {
  const Tag = type === "name" ? "h1" : "h2";

  return (
    <>
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <Tag>{item}</Tag>
          {separator && i < items.length - 1 && <h2>{separator}</h2>}
        </React.Fragment>
      ))}
      <br />
    </>
  );
};

HeaderText.propTypes = {
  type: PropTypes.oneOf(["name", "roles", "title"]).isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  separator: PropTypes.string,
};

const HEADER_SECTIONS: {
  type: "name" | "roles" | "title";
  items: string[];
  separator?: string;
}[] = [
  { type: "name", items: ["Aaron", "Lorenzo", "Woods"] },
  {
    type: "roles",
    items: ["Engineer", "Artist", "Scientist"],
    separator: " | ",
  },
  {
    type: "title",
    items: ["Biomedical", "Engineering", "Doctoral", "Student"],
  },
];

const SOCIAL_MEDIA = [
  {
    keyword: "Email",
    icon: "fas fa-envelope-square",
    link: "mailto:alwoods@utexas.edu",
    tooltip: "Email: alwoods@utexas.edu",
  },
  {
    keyword: "LinkedIn",
    icon: "fab fa-linkedin",
    link: "https://www.linkedin.com/in/woods-aaron/",
    tooltip: "LinkedIn: woods-aaron",
  },
  {
    keyword: "GitHub",
    icon: "fab fa-github",
    link: "https://github.com/guitarbeat",
    tooltip: "GitHub: guitarbeat",
  },
  {
    keyword: "Instagram",
    icon: "fab fa-instagram",
    link: "https://www.instagram.com/guitarbeat/",
    tooltip: "Instagram: @guitarbeat",
  },
  {
    keyword: "Twitter",
    icon: "fab fa-x-twitter",
    link: "https://twitter.com/WoodsResearch",
    tooltip: "Twitter: @WoodsResearch",
  },
  {
    keyword: "CV",
    icon: "fas fa-file-alt",
    link: cvFile,
    tooltip: "Download my CV",
  },
  {
    keyword: "Google Scholar",
    icon: "fas fa-graduation-cap",
    link: "https://scholar.google.com/citations?user=85U8cEoAAAAJ&hl=en&authuser=1",
    tooltip: "View my Google Scholar profile",
  },
];

const AVATAR_TRANSITION_FALLBACK_MS = 500;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Header() {
  const headerRef = useRef<HTMLDivElement>(null);
  const transitionFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [profileIndex, setProfileIndex] = useState<number>(() =>
    readStoredProfileIndex(),
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [slideActive, setSlideActive] = useState(false);

  useScrambleEffect(headerRef);

  const persistProfileIndex = useCallback((index: number) => {
    try {
      sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, String(index));
    } catch {
      /* quota / private mode */
    }
  }, []);

  const completeTransition = useCallback(() => {
    if (transitionFallbackRef.current) {
      clearTimeout(transitionFallbackRef.current);
      transitionFallbackRef.current = null;
    }

    if (incomingIndex === null) {
      return;
    }

    setProfileIndex(incomingIndex);
    persistProfileIndex(incomingIndex);
    setIsTransitioning(false);
    setOutgoingIndex(null);
    setIncomingIndex(null);
    setSlideActive(false);
  }, [incomingIndex, persistProfileIndex]);

  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideActive(true);
      });
    });

    transitionFallbackRef.current = setTimeout(() => {
      completeTransition();
    }, AVATAR_TRANSITION_FALLBACK_MS);

    return () => {
      cancelAnimationFrame(frameId);
      if (transitionFallbackRef.current) {
        clearTimeout(transitionFallbackRef.current);
        transitionFallbackRef.current = null;
      }
    };
  }, [completeTransition, isTransitioning]);

  const handleClick = () => {
    if (isTransitioning) {
      return;
    }

    const nextIndex = (profileIndex + 1) % PROFILE_IMAGES.length;

    if (prefersReducedMotion()) {
      setProfileIndex(nextIndex);
      persistProfileIndex(nextIndex);
      return;
    }

    setOutgoingIndex(profileIndex);
    setIncomingIndex(nextIndex);
    setSlideActive(false);
    setIsTransitioning(true);
  };

  const handleOutgoingTransitionEnd = (
    e: React.TransitionEvent<HTMLImageElement>,
  ) => {
    if (e.propertyName !== "transform") {
      return;
    }
    completeTransition();
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = FALLBACK_PROFILE_SRC;
  };

  const renderAvatarImage = (
    index: number,
    className: string,
    options: {
      fetchPriority?: "high";
      onTransitionEnd?: (e: React.TransitionEvent<HTMLImageElement>) => void;
    } = {},
  ) => {
    const image = PROFILE_IMAGES[index];

    return (
      <img
        className={cn("avatar__photo", className)}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        fetchPriority={options.fetchPriority}
        onError={handleImageError}
        onTransitionEnd={options.onTransitionEnd}
      />
    );
  };

  const renderAvatarContent = () => {
    if (
      isTransitioning &&
      outgoingIndex !== null &&
      incomingIndex !== null
    ) {
      return (
        <>
          {renderAvatarImage(
            outgoingIndex,
            slideActive
              ? "avatar__photo--outgoing avatar__photo--outgoing-exiting"
              : "avatar__photo--outgoing",
            { onTransitionEnd: handleOutgoingTransitionEnd },
          )}
          {renderAvatarImage(
            incomingIndex,
            slideActive
              ? "avatar__photo--incoming avatar__photo--incoming-active"
              : "avatar__photo--incoming",
          )}
        </>
      );
    }

    return renderAvatarImage(profileIndex, "avatar__photo--active", {
      fetchPriority: "high",
    });
  };

  return (
    <div className="container" id="header" ref={headerRef}>
      <div className="container__content">
        <div className="header">
          <div className="header__image-container">
            <button
              type="button"
              onClick={handleClick}
              aria-label="Change profile image"
              aria-busy={isTransitioning}
            >
              <span className="avatar">
                <span className="avatar__viewport">{renderAvatarContent()}</span>
              </span>
            </button>
          </div>
          <div className="header__text">
            {HEADER_SECTIONS.map((section) => (
              <HeaderText key={section.type} {...section} />
            ))}
            <div className="social">
              {SOCIAL_MEDIA.map((s) => (
                <SocialMedia key={s.keyword} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
