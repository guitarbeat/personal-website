// Third-party imports
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
// Custom hooks
import { useDraggable } from "@/hooks/useDraggable";
import { cn } from "@/utils/commonUtils";
// Context imports
import { useUnlock } from "../../effects/Matrix/UnlockContext";

// Theme Configuration
const THEME = {
  LIGHT: "light",
  DARK: "dark",
  STORAGE_KEY: "theme",
  CLASS_NAME: "light-theme",
};

// Utility functions

const isBrowser = typeof window !== "undefined";
const isDocumentAvailable = typeof document !== "undefined";
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

const getInitialTheme = () => {
  if (!isBrowser) {
    return false;
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME.STORAGE_KEY);
    if (savedTheme) {
      return savedTheme === THEME.LIGHT;
    }
  } catch (_error) {
    // Swallow storage access errors (Safari private mode, etc.)
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }

  return false;
};

const updateThemeColor = (isLight: boolean) => {
  if (!isDocumentAvailable) {
    return;
  }

  const themeColor = isLight ? "#ffffff" : "#1a1a1a";
  const existingMeta =
    document.querySelector("meta#theme-color") ??
    document.querySelector('meta[name="theme-color"]');

  if (existingMeta) {
    existingMeta.setAttribute("content", themeColor);
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.id = "theme-color";
  meta.setAttribute("content", themeColor);
  document.head.appendChild(meta);
};

interface NavBarProps {
  items: Record<string, string>;
  onMatrixActivate: () => void;
  isInShop?: boolean;
}

function NavBar({ items, onMatrixActivate, isInShop = false }: NavBarProps) {
  const themeClickTimesRef = useRef<number[]>([]);
  const themeSwitchRef = useRef<HTMLButtonElement>(null);
  const [isLightTheme, setIsLightTheme] = useState(getInitialTheme);
  const { isUnlocked } = useUnlock();

  const {
    elementRef: navbarRef,
    hasOverflow,
    dragProps,
  } = useDraggable<HTMLElement>();

  // Create navItems conditionally - memoized to prevent unnecessary re-renders
  const navItems = useMemo(() => {
    let result = { ...items };
    if (isInShop) {
      result = {
        Home: "/",
      };
    }
    return result;
  }, [items, isInShop]);

  const filteredNavItems = Object.entries(navItems).filter(([label]) => {
    if (label === "Scroll") {
      return isUnlocked;
    }
    return true;
  });

  const handleThemeClick = useCallback(() => {
    const now = Date.now();
    const clickTimes = themeClickTimesRef.current;

    clickTimes.push(now);

    while (clickTimes.length > 0 && now - clickTimes[0] >= 2000) {
      clickTimes.shift();
    }

    if (clickTimes.length >= 5) {
      clickTimes.length = 0;
      if (onMatrixActivate) {
        onMatrixActivate();
      }
    }

    const nextIsLightTheme = !isLightTheme;
    setIsLightTheme(nextIsLightTheme);
  }, [isLightTheme, onMatrixActivate]);

  useIsomorphicLayoutEffect(() => {
    if (!isDocumentAvailable) {
      return;
    }

    document.body.classList.toggle(THEME.CLASS_NAME, isLightTheme);
    updateThemeColor(isLightTheme);
  }, [isLightTheme]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(
        THEME.STORAGE_KEY,
        isLightTheme ? THEME.LIGHT : THEME.DARK,
      );
    } catch (_error) {
      // Ignore persistence failures (quota restrictions, etc.)
    }
  }, [isLightTheme]);

  // * Handle smooth scrolling for hash navigation
  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    // Only intercept hash links (#anchor or /#anchor)
    if (href.includes("#")) {
      e.preventDefault();

      // Extract the ID from URLs like "/#about" or "#about"
      const hashIndex = href.indexOf("#");
      const targetId = href.substring(hashIndex + 1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, []);

  const links = filteredNavItems.map(([label, href]) => (
    <li key={label} className="navbar__item">
      <Link
        to={isInShop && label === "Home" ? "/" : href}
        onClick={(e) => handleNavClick(e, href)}
      >
        {label}
      </Link>
    </li>
  ));

  return (
    <nav
      ref={navbarRef}
      className={cn("navbar", hasOverflow && "mobile-draggable")}
      {...dragProps}
    >
      <div className="navbar__content">
        <button
          ref={themeSwitchRef}
          className={cn("theme-switch", isLightTheme && "light-theme")}
          onClick={handleThemeClick}
          role="switch"
          aria-checked={isLightTheme}
          aria-label={`Switch to ${isLightTheme ? "dark" : "light"} theme`}
          type="button"
        >
          <div className="switch-handle">
            <div className="moon-phase-container" />
          </div>
        </button>
        <ul className="navbar__links">{links}</ul>
      </div>
    </nav>
  );
}

export default NavBar;
