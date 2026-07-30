import PropTypes from "prop-types";
// Third-party imports
import React, { useCallback, useEffect, useRef, useState } from "react";

import cvFile from "../../../assets/documents/cv.pdf";

// Local imports
import { cn } from "@/utils/commonUtils";
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

export const AVATAR_TRANSITION_FALLBACK_MS = 1400;

type AvatarPhase = "idle" | "shrink" | "slideOut" | "slideIn" | "expand";

function isAvatarScaleTransition(
  event: React.TransitionEvent<HTMLElement>,
): boolean {
  return (
    !event.propertyName ||
    event.propertyName === "transform" ||
    event.propertyName === "--init-scale"
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Header() {
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitionFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const phaseRef = useRef<AvatarPhase>("idle");
  const shouldExpandRef = useRef(false);
  const incomingIndexRef = useRef<number | null>(null);

  const [profileIndex, setProfileIndex] = useState<number>(() =>
    readStoredProfileIndex(),
  );
  const [phase, setPhase] = useState<AvatarPhase>("idle");
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [shouldExpand, setShouldExpand] = useState(false);
  const [phaseAnimating, setPhaseAnimating] = useState(false);

  phaseRef.current = phase;
  shouldExpandRef.current = shouldExpand;
  incomingIndexRef.current = incomingIndex;

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

    const nextIndex = incomingIndexRef.current;
    if (nextIndex === null) {
      return;
    }

    setProfileIndex(nextIndex);
    persistProfileIndex(nextIndex);
    setPhase("idle");
    setOutgoingIndex(null);
    setIncomingIndex(null);
    setShouldExpand(false);
    setPhaseAnimating(false);
  }, [persistProfileIndex]);

  useEffect(() => {
    if (phase === "idle") {
      return;
    }

    setPhaseAnimating(false);

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhaseAnimating(true);
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [phase]);

  const handleClick = () => {
    if (phase !== "idle") {
      return;
    }

    const nextIndex = (profileIndex + 1) % PROFILE_IMAGES.length;

    if (prefersReducedMotion()) {
      setProfileIndex(nextIndex);
      persistProfileIndex(nextIndex);
      return;
    }

    const wasHovered = buttonRef.current?.matches(":hover") ?? false;

    incomingIndexRef.current = nextIndex;
    setOutgoingIndex(profileIndex);
    setIncomingIndex(nextIndex);
    setShouldExpand(wasHovered);
    setPhaseAnimating(false);
    setPhase(wasHovered ? "shrink" : "slideOut");

    transitionFallbackRef.current = setTimeout(() => {
      completeTransition();
    }, AVATAR_TRANSITION_FALLBACK_MS);
  };

  const handleAvatarTransitionEnd = (
    e: React.TransitionEvent<HTMLSpanElement>,
  ) => {
    if (e.target !== e.currentTarget || !isAvatarScaleTransition(e)) {
      return;
    }

    const currentPhase = phaseRef.current;

    if (currentPhase === "shrink") {
      setPhaseAnimating(false);
      setPhase("slideOut");
      return;
    }

    if (currentPhase === "expand") {
      completeTransition();
    }
  };

  const handlePhotoTransitionEnd = (
    e: React.TransitionEvent<HTMLImageElement>,
  ) => {
    if (!isAvatarScaleTransition(e)) {
      return;
    }

    const currentPhase = phaseRef.current;

    if (currentPhase === "slideOut") {
      setPhaseAnimating(false);
      setPhase("slideIn");
      return;
    }

    if (currentPhase === "slideIn") {
      setPhaseAnimating(false);

      if (shouldExpandRef.current) {
        setPhase("expand");
        return;
      }

      completeTransition();
    }
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
        key={image.src}
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

  const getAvatarClassName = () => {
    if (phase === "idle") {
      return "avatar";
    }

    if (phase === "shrink") {
      return cn(
        "avatar",
        "avatar--transitioning",
        phaseAnimating ? "avatar--scale-rest" : "avatar--scale-from-hover",
      );
    }

    if (phase === "slideOut" || phase === "slideIn") {
      return cn("avatar", "avatar--transitioning", "avatar--scale-rest");
    }

    if (phase === "expand") {
      return cn(
        "avatar",
        "avatar--transitioning",
        phaseAnimating ? "avatar--scale-hover" : "avatar--scale-rest",
      );
    }

    return "avatar";
  };

  const renderAvatarContent = () => {
    if (phase === "idle") {
      return renderAvatarImage(profileIndex, "avatar__photo--active", {
        fetchPriority: "high",
      });
    }

    if (
      (phase === "shrink" || phase === "slideOut") &&
      outgoingIndex !== null
    ) {
      return renderAvatarImage(
        outgoingIndex,
        cn(
          "avatar__photo--outgoing",
          phase === "slideOut" &&
            phaseAnimating &&
            "avatar__photo--outgoing-exiting",
        ),
        {
          onTransitionEnd:
            phase === "slideOut" ? handlePhotoTransitionEnd : undefined,
        },
      );
    }

    if (
      (phase === "slideIn" || phase === "expand") &&
      incomingIndex !== null
    ) {
      const photoClassName =
        phase === "expand"
          ? "avatar__photo--active"
          : cn(
              "avatar__photo--incoming",
              phaseAnimating && "avatar__photo--incoming-active",
            );

      return renderAvatarImage(incomingIndex, photoClassName, {
        onTransitionEnd:
          phase === "slideIn" ? handlePhotoTransitionEnd : undefined,
      });
    }

    return null;
  };

  const isTransitioning = phase !== "idle";

  return (
    <div className="container" id="header" ref={headerRef}>
      <div className="container__content">
        <div className="header">
          <div className="header__image-container">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleClick}
              aria-label="Change profile image"
              aria-busy={isTransitioning}
            >
              <span
                className={getAvatarClassName()}
                onTransitionEnd={handleAvatarTransitionEnd}
              >
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
