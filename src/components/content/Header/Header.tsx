import PropTypes from "prop-types";
// Third-party imports
import React, { useRef, useState } from "react";

import cvFile from "../../../assets/documents/cv.pdf";
// Asset imports
import profile1 from "../../../assets/images/profile1-nbg.png";
import profile2 from "../../../assets/images/profile2-nbg.png";
import profile3 from "../../../assets/images/profile3-nbg.png";
import profile4 from "../../../assets/images/profile4.png";

// Local imports
import { cn } from "../../../utils/commonUtils";
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

const PROFILE_IMAGES = [
  { src: profile1, alt: "Profile one" },
  { src: profile2, alt: "Profile two" },
  { src: profile3, alt: "Profile three" },
  { src: profile4, alt: "Profile four", isFallback: true },
];

const FALLBACK_PROFILE_SRC =
  PROFILE_IMAGES.find((image) => image.isFallback)?.src ??
  PROFILE_IMAGES[0].src;

function Header() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [profileIndex, setProfileIndex] = useState<number>(() =>
    Math.floor(Math.random() * PROFILE_IMAGES.length),
  );

  useScrambleEffect(headerRef);

  const handleClick = () => {
    setProfileIndex((prev) => (prev + 1) % PROFILE_IMAGES.length);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = FALLBACK_PROFILE_SRC;
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
            >
              {PROFILE_IMAGES.map(({ src, alt }, index) => (
                <img
                  key={src}
                  className={cn("avatar", profileIndex === index && "active")}
                  src={src}
                  alt={alt}
                  onError={handleImageError}
                />
              ))}
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
