import { memo, type ReactNode } from "react";

import FrameEffect from "@/components/effects/Loading/FrameEffect";
import { useAuth } from "@/components/effects/Matrix/AuthContext";
import ScrollToTopButton from "@/components/effects/Matrix/ScrollToTopButton";
import MagicComponent from "@/components/effects/Moire/Moire";
import { NavBar } from "@/components/index";

export const SiteStatusPill = memo(() => (
  <div className="site-status-pill" role="status">
    Showing cached content. Live refresh is unavailable.
  </div>
));
SiteStatusPill.displayName = "SiteStatusPill";

export function ContentUnavailableState({ error }: { error: string | null }) {
  return (
    <div className="content-unavailable">
      <div className="content-unavailable__panel">
        <p className="content-unavailable__eyebrow">Content unavailable</p>
        <h1>Site content is temporarily unavailable.</h1>
        <p>
          The live content refresh failed and there is no cached snapshot
          available yet. Please try again shortly.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload page
        </button>
        {process.env.NODE_ENV === "development" && error ? (
          <pre>{error}</pre>
        ) : null}
      </div>
    </div>
  );
}

const UnlockedBadge = memo(() => {
  const { isUnlocked } = useAuth();

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="unlocked-badge" role="img" aria-label="Site unlocked">
      <i className="fas fa-unlock" aria-hidden="true" />
    </div>
  );
});
UnlockedBadge.displayName = "UnlockedBadge";

export interface SiteLayoutProps {
  children: ReactNode;
  navItems: Record<string, string>;
  onMatrixActivate: () => void;
  isInScroll: boolean;
  hideNavBar: boolean;
  isDegraded: boolean;
  isBackgroundVisible: boolean;
}

export const SiteLayout = memo(
  ({
    children,
    navItems,
    onMatrixActivate,
    isInScroll,
    hideNavBar,
    isDegraded,
    isBackgroundVisible,
  }: SiteLayoutProps) => (
    <div className="app-layout">
      <div className="vignette-top" />
      <div className="vignette-bottom" />
      <div className="vignette-left" />
      <div className="vignette-right" />
      {isDegraded ? <SiteStatusPill /> : null}
      {!hideNavBar ? (
        <NavBar
          items={navItems}
          onMatrixActivate={onMatrixActivate}
          isInShop={isInScroll}
        />
      ) : null}
      <MagicComponent isVisible={isBackgroundVisible} opacity={0.2} />
      <main id="main-content">
        <FrameEffect>{children}</FrameEffect>
      </main>
      <ScrollToTopButton />
      <UnlockedBadge />
    </div>
  ),
);
SiteLayout.displayName = "SiteLayout";
