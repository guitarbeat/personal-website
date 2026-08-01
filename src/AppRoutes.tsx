import { lazy, Suspense, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { SiteLayout } from "@/components/Core/SiteLayout";
import { BlurSection } from "@/components/effects/Blur/index";
import InfiniteScrollEffect from "@/components/effects/InfiniteScrollEffect";
import { shouldShowMatrixFromSearch } from "@/hooks/useMatrixActivation";
import { HomePage } from "@/pages/HomePage";

const Matrix = lazy(() => import("@/components/effects/Matrix/Matrix"));

interface MatrixModalProps {
  showMatrix: boolean;
  onDismiss: () => void;
  onMatrixReady: (callback: (() => void) | null) => void;
}

export function MatrixModal({
  showMatrix,
  onDismiss,
  onMatrixReady,
}: MatrixModalProps) {
  if (!showMatrix) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Matrix
        isVisible={showMatrix}
        onDismiss={onDismiss}
        onMatrixReady={onMatrixReady}
      />
    </Suspense>
  );
}

interface MatrixRouteSyncProps {
  showMatrix: boolean;
  onRouteMatrixChange: (shouldShow: boolean) => void;
}

export function MatrixRouteSync({
  showMatrix,
  onRouteMatrixChange,
}: MatrixRouteSyncProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const shouldShow = shouldShowMatrixFromSearch(location.search);
    onRouteMatrixChange(shouldShow);
  }, [location.search, onRouteMatrixChange]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldShow = shouldShowMatrixFromSearch(params);

    if (showMatrix) {
      const currentValue = params.get("matrix");
      if (shouldShow && currentValue === "1") {
        return;
      }
      params.set("matrix", "1");
    } else {
      if (!params.has("matrix")) {
        return;
      }
      params.delete("matrix");
    }

    const searchString = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchString ? `?${searchString}` : "",
        hash: location.hash,
      },
      { replace: true },
    );
  }, [showMatrix, location.pathname, location.search, location.hash, navigate]);

  return null;
}

export interface AppRoutesProps {
  navItems: Record<string, string>;
  onMatrixActivate: () => void;
  onScrollActivate: () => void;
  isScrollMode: boolean;
  isUnlocked: boolean;
  isInScroll: boolean;
  isDegraded: boolean;
  showMatrix: boolean;
  onMatrixReady: (callback: (() => void) | null) => void;
  isBackgroundVisible: boolean;
}

export function AppRoutes({
  navItems,
  onMatrixActivate,
  onScrollActivate: _onScrollActivate,
  isScrollMode,
  isUnlocked,
  isInScroll,
  isDegraded,
  showMatrix: _showMatrix,
  onMatrixReady: _onMatrixReady,
  isBackgroundVisible,
}: AppRoutesProps) {
  const location = useLocation();
  const currentIsInScroll = location.pathname === "/scroll" || isInScroll;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <SiteLayout
            navItems={navItems}
            onMatrixActivate={onMatrixActivate}
            isInScroll={currentIsInScroll}
            isDegraded={isDegraded}
            isBackgroundVisible={isBackgroundVisible}
            hideNavBar={false}
          >
            <BlurSection as="div" disabled={!isUnlocked} className="">
              <InfiniteScrollEffect shopMode={isScrollMode}>
                <HomePage />
              </InfiniteScrollEffect>
            </BlurSection>
          </SiteLayout>
        }
      />
      <Route
        path="/scroll"
        element={
          <SiteLayout
            navItems={navItems}
            onMatrixActivate={onMatrixActivate}
            isInScroll={true}
            isDegraded={isDegraded}
            isBackgroundVisible={isBackgroundVisible}
            hideNavBar={true}
          >
            <BlurSection as="div" disabled={false} className="">
              <InfiniteScrollEffect shopMode={true}>
                <HomePage />
              </InfiniteScrollEffect>
            </BlurSection>
          </SiteLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
