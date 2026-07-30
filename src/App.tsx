import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import {
  AppRoutes,
  MatrixModal,
  MatrixRouteSync,
} from "@/AppRoutes";
import { ContentUnavailableState } from "@/components/Core/SiteLayout";
import { NAV_ITEMS } from "@/components/Core/constants";
import {
  AuthProvider,
  useAuth,
} from "@/components/effects/Matrix/AuthContext";
import LoadingSequence from "@/components/effects/Loading/LoadingSequence";
import { NotionProvider, useNotion } from "@/contexts/NotionContext";
import { useMatrixActivation } from "@/hooks/useMatrixActivation";
import { useScrollMode } from "@/hooks/useScrollMode";
import "./sass/main.scss";

const CustomCursor = lazy(
  () => import("@/components/effects/CustomCursor/CustomCursor"),
);

const INITIAL_LOADER_MIN_DURATION_MS = 500;

function AppContent() {
  const { db, error, isDegraded, loading } = useNotion();
  const {
    showMatrix,
    handleMatrixActivate,
    handleMatrixSuccess,
    handleRouteMatrixChange,
    handleMatrixReady,
  } = useMatrixActivation();
  const { isUnlocked } = useAuth();
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

  const handleInitialLoaderExit = useCallback(() => {
    setIsInitialLoaderVisible(false);
  }, []);

  return (
    <>
      <LoadingSequence
        isVisible={isInitialLoaderVisible}
        isReadyToReveal={canRevealInitialLoader}
        onExitComplete={handleInitialLoaderExit}
      />
      <MatrixModal
        showMatrix={showMatrix}
        onSuccess={handleMatrixSuccess}
        onMatrixReady={handleMatrixReady}
      />
      {isUnlocked ? (
        <Suspense fallback={null}>
          <CustomCursor />
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
    <AuthProvider>
      <AppContent />
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  </NotionProvider>
);

export default App;
