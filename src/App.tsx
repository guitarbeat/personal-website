import { Analytics } from "@vercel/analytics/react";
import SkipLink from "@/components/Core/SkipLink";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes, MatrixModal, MatrixRouteSync } from "@/AppRoutes";
import { NAV_ITEMS } from "@/components/Core/constants";
import { ContentUnavailableState } from "@/components/Core/SiteLayout";
import LoadingSequence from "@/components/effects/Loading/LoadingSequence";
import {
  UnlockProvider,
  useUnlock,
} from "@/components/effects/Matrix/UnlockContext";
import { canMountSiteProof } from "@/components/effects/Proof/siteProofMount";
import { NotionProvider, useNotion } from "@/contexts/NotionContext";
import { useMatrixActivation } from "@/hooks/useMatrixActivation";
import { useScrollMode } from "@/hooks/useScrollMode";
import { isVercelHostedBuild } from "@/utils/vercelHost";
import "./sass/main.scss";

const CustomCursor = lazy(
  () => import("@/components/effects/CustomCursor/CustomCursor"),
);
const SiteProof = lazy(async () => {
  const module = await import("@/components/effects/Proof/SiteProof");
  return { default: module.SiteProof };
});

const INITIAL_LOADER_MIN_DURATION_MS = 100;

function AppContent() {
  const { db, error, isDegraded, loading } = useNotion();
  const {
    showMatrix,
    handleMatrixActivate,
    handleMatrixDismiss,
    handleRouteMatrixChange,
    handleMatrixReady,
  } = useMatrixActivation();
  const { isUnlocked } = useUnlock();
  const { isScrollMode, isInScroll, activateScrollMode } = useScrollMode();
  const [isInitialLoaderVisible, setIsInitialLoaderVisible] = useState(true);
  const [hasMinimumLoaderDurationElapsed, setHasMinimumLoaderDurationElapsed] =
    useState(false);

  useEffect(() => {
    const minimumLoaderDurationTimeout = window.setTimeout(() => {
      setHasMinimumLoaderDurationElapsed(true);
    }, INITIAL_LOADER_MIN_DURATION_MS);

    return () => {
      window.clearTimeout(minimumLoaderDurationTimeout);
    };
  }, []);

  const hasRenderableContent =
    db.about.length > 0 || db.projects.length > 0 || db.work.length > 0;
  const showUnavailableState = !loading && !hasRenderableContent;
  const isBackgroundVisible = true;
  const canRevealInitialLoader =
    isInitialLoaderVisible && hasMinimumLoaderDurationElapsed;
  const shouldMountProof = canMountSiteProof({
    isUnlocked,
    isInitialLoaderVisible,
    showMatrix,
  });

  const handleInitialLoaderExit = useCallback(() => {
    setIsInitialLoaderVisible(false);
  }, []);

  return (
    <>
      <SkipLink />
      <LoadingSequence
        isVisible={isInitialLoaderVisible}
        isReadyToReveal={canRevealInitialLoader}
        onExitComplete={handleInitialLoaderExit}
      />
      <MatrixModal
        showMatrix={showMatrix}
        onDismiss={handleMatrixDismiss}
        onMatrixReady={handleMatrixReady}
      />
      {isUnlocked ? (
        <Suspense fallback={null}>
          <CustomCursor />
        </Suspense>
      ) : null}
      {shouldMountProof ? (
        <Suspense fallback={null}>
          <SiteProof />
        </Suspense>
      ) : null}
      {showUnavailableState ? (
        <ContentUnavailableState error={error} />
      ) : (
        <BrowserRouter>
          <MatrixRouteSync
            showMatrix={showMatrix}
            onRouteMatrixChange={handleRouteMatrixChange}
          />
          <Suspense fallback={null}>
            <AppRoutes
              navItems={NAV_ITEMS}
              onMatrixActivate={handleMatrixActivate}
              onScrollActivate={activateScrollMode}
              isScrollMode={isScrollMode}
              isUnlocked={isUnlocked}
              isInScroll={isInScroll}
              isDegraded={isDegraded}
              showMatrix={showMatrix}
              onMatrixReady={handleMatrixReady}
              isBackgroundVisible={isBackgroundVisible}
            />
          </Suspense>
        </BrowserRouter>
      )}
    </>
  );
}

const App = () => (
  <NotionProvider>
    <UnlockProvider>
      <AppContent />
      {isVercelHostedBuild() ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </UnlockProvider>
  </NotionProvider>
);

export default App;
