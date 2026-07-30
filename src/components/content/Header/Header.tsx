import PropTypes from "prop-types";
// Third-party imports
import React from "react";

import cvFile from "../../../assets/documents/cv.pdf";

// Local imports
import useScrambleEffect from "./useScrambleEffect";
import { useAvatarTransition } from "./useAvatarTransition";

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
            width={400}
            height={400}
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

export { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";

function Header() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const avatar = useAvatarTransition();

  useScrambleEffect(headerRef);

  return (
    <div className="container" id="header" ref={headerRef}>
      <div className="container__content">
        <div className="header">
          <div className="header__image-container">
            <button
              ref={avatar.buttonRef}
              type="button"
              onClick={avatar.handleClick}
              aria-label="Change profile image"
              aria-busy={avatar.isTransitioning}
            >
              <span
                className={avatar.frameClassName}
                onTransitionEnd={avatar.handleFrameTransitionEnd}
              >
                <span className="avatar__viewport">{avatar.content}</span>
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
