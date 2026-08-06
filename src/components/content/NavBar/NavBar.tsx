// Third-party imports
import { useMemo } from "react";
import { Link } from "react-router-dom";
// Custom hooks
import { cn } from "@/utils/commonUtils";
// Context imports
import { useUnlock } from "../../effects/Matrix/UnlockContext";
import { useDraggableNavbar } from "./hooks/useDraggableNavbar";
import { useTheme } from "./hooks/useTheme";
// Utilities
import { handleNavClick } from "./utils/navUtils";

interface NavBarProps {
  items: Record<string, string>;
  onMatrixActivate: () => void;
  isInShop?: boolean;
}

function NavBar({ items, onMatrixActivate, isInShop = false }: NavBarProps) {
  const { isUnlocked } = useUnlock();

  const { isLightTheme, handleThemeClick, themeSwitchRef } =
    useTheme(onMatrixActivate);

  const {
    navbarRef,
    hasOverflow,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDraggableNavbar();

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
