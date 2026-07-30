import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { NotionProvider, useNotion } from "./contexts/NotionContext";
import { useScrollMode } from "./hooks/useScrollMode";
import "./sass/main.scss";
import FrameEffect from "@/components/effects/Loading/FrameEffect";
import LoadingSequence from "@/components/effects/Loading/LoadingSequence";
import { NAV_ITEMS } from "./components/Core/constants";
import { BlurSection } from "./components/effects/Blur/index";
import InfiniteScrollEffect from "./components/effects/InfiniteScrollEffect";
import { AuthProvider, useAuth } from "./components/effects/Matrix/AuthContext";
import ScrollToTopButton from "./components/effects/Matrix/ScrollToTopButton";

const CustomCursor = lazy(
  () => import("./components/effects/CustomCursor/CustomCursor"),
);
const Matrix = lazy(() => import("./components/effects/Matrix/Matrix"));
import MagicComponent from "./components/effects/Moire/Moire";
import { About, Header, NavBar, Projects, Work } from "./components/index";

const INITIAL_LOADER_MIN_DURATION_MS = 500;

const SiteStatusPill = memo(() => (
  <div className="site-status-pill" role="status">
    Showing cached content. Live refresh is unavailable.
  </div>
));
SiteStatusPill.displayName = "SiteStatusPill";

const ContentUnavailableState = ({ error }: { error: string | null }) => (
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

// * Unlocked badge component
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

interface LayoutProps {
  children: React.ReactNode;
  navItems: Record<string, string>;
  onMatrixActivate: () => void;
  onScrollActivate: () => void;
  isInScroll: boolean;
  hideNavBar: boolean;
  isDegraded: boolean;
  isBackgroundVisible: boolean;
  showMatrix?: boolean;
  onMatrixReady?: (callback: () => void) => void;
  isUnlocked?: boolean;
}

// * Layout wrapper
const Layout = memo(
  ({
    children,
    navItems,
    onMatrixActivate,
    onScrollActivate: _onScrollActivate,
    isInScroll,
    hideNavBar,
    isDegraded,
    isBackgroundVisible,
  }: LayoutProps) => (
    <div className="app-layout">
      <div className="vignette-top" />
      <div className="vignette-bottom" />
      <div className="vignette-left" />
      <div className="vignette-right" />
      {isDegraded ? <SiteStatusPill /> : null}
      {!hideNavBar && (
        <NavBar
          items={navItems}
          onMatrixActivate={onMatrixActivate}
          isInShop={isInScroll}
        />
      )}
      <MagicComponent isVisible={isBackgroundVisible} opacity={0.2} />
      <main id="main-content">
        <FrameEffect>{children}</FrameEffect>
      </main>
      <ScrollToTopButton />
      <UnlockedBadge />
    </div>
  ),
);
Layout.displayName = "Layout";

// * Home page content
const HomePageContent = () => (
  <div>
    <Header />
    <About />
    <Projects />
    <Work />
  </div>
);

interface MatrixModalProps {
  showMatrix: boolean;
  onSuccess: () => void;
  onMatrixReady: (callback: (() => void) | null) => void;
}

// * Matrix modal wrapper
const MatrixModal = ({
  showMatrix,
  onSuccess,
  onMatrixReady,
}: MatrixModalProps) => {
  if (!showMatrix) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Matrix
        isVisible={showMatrix}
        onSuccess={onSuccess}
        onMatrixReady={onMatrixReady}
      />
    </Suspense>
  );
};

const MATRIX_DISABLED_VALUES = new Set(["0", "false", "off", "no"]);
const MATRIX_ENABLED_VALUES = new Set(["1", "true", "on", "yes"]);

const shouldShowMatrixFromSearch = (search: string | URLSearchParams) => {
  const params =
    typeof search === "string" || search instanceof URLSearchParams
      ? new URLSearchParams(search)
      : new URLSearchParams();
  if (!params.has("matrix")) {
    return false;
  }

  const value = params.get("matrix");
  if (!value) {
    return false;
  }
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "") {
    return false;
  }

  if (MATRIX_DISABLED_VALUES.has(normalizedValue)) {
    return false;
  }

  if (MATRIX_ENABLED_VALUES.has(normalizedValue)) {
    return true;
  }

  return false;
};

interface MatrixRouteSyncProps {
  showMatrix: boolean;
  onRouteMatrixChange: (shouldShow: boolean) => void;
}

const MatrixRouteSync = ({
  showMatrix,
  onRouteMatrixChange,
}: MatrixRouteSyncProps) => {
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
};

interface MainRoutesProps {
  navItems: Record<string, string>;
  onMatrixActivate: () => void;
  onScrollActivate: () => void;
  isScrollMode: boolean;
  isUnlocked: boolean;
  isInScroll: boolean;
  isDegraded: boolean;
  showMatrix: boolean;
  onMatrixReady: (callback: () => void) => void;
  isBackgroundVisible: boolean;
}

// * Main routes
const MainRoutes = ({
  navItems,
  onMatrixActivate,
  onScrollActivate,
  isScrollMode,
  isUnlocked,
  isInScroll,
  isDegraded,
  showMatrix,
  onMatrixReady,
  isBackgroundVisible,
}: MainRoutesProps) => {
  const location = useLocation();
  const currentIsInScroll = location.pathname === "/scroll" || isInScroll;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            navItems={navItems}
            onMatrixActivate={onMatrixActivate}
            onScrollActivate={onScrollActivate}
            isInScroll={currentIsInScroll}
            showMatrix={showMatrix}
            onMatrixReady={onMatrixReady}
            isUnlocked={isUnlocked}
            isDegraded={isDegraded}
            isBackgroundVisible={isBackgroundVisible}
            hideNavBar={false}
          >
            <BlurSection as="div" disabled={!isUnlocked} className="">
              <InfiniteScrollEffect shopMode={isScrollMode}>
                <HomePageContent />
              </InfiniteScrollEffect>
            </BlurSection>
          </Layout>
        }
      />
      <Route
        path="/scroll"
        element={
          <Layout
            navItems={navItems}
            onMatrixActivate={onMatrixActivate}
            onScrollActivate={onScrollActivate}
            isInScroll={true}
            showMatrix={showMatrix}
            onMatrixReady={onMatrixReady}
            isUnlocked={true}
            isDegraded={isDegraded}
            isBackgroundVisible={isBackgroundVisible}
            hideNavBar={true}
          >
            <BlurSection as="div" disabled={false} className="">
              <InfiniteScrollEffect shopMode={true}>
                <HomePageContent />
              </InfiniteScrollEffect>
            </BlurSection>
          </Layout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// * Main app content logic
const AppContent = () => {
  // --- State and refs ---
  const { db, error, isDegraded, loading } = useNotion();
  const [showMatrix, setShowMatrix] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return shouldShowMatrixFromSearch(window.location.search);
  });
  const { isUnlocked } = useAuth();
  const { isScrollMode, isInScroll, activateScrollMode } = useScrollMode();
  const [isInitialLoaderVisible, setIsInitialLoaderVisible] = useState(true);
  const [hasMinimumLoaderDurationElapsed, setHasMinimumLoaderDurationElapsed] =
    useState(false);

  // --- Effects ---

  useEffect(() => {
    const minimumLoaderDurationTimeout = window.setTimeout(() => {
      setHasMinimumLoaderDurationElapsed(true);
    }, INITIAL_LOADER_MIN_DURATION_MS);

    return () => {
      window.clearTimeout(minimumLoaderDurationTimeout);
    };
  }, []);

  // --- Handlers ---
  const handleMatrixActivate = useCallback(() => setShowMatrix(true), []);
  const handleMatrixSuccess = useCallback(() => setShowMatrix(false), []);
  const handleRouteMatrixChange = useCallback((shouldShow: boolean) => {
    setShowMatrix((prev) => (prev === shouldShow ? prev : shouldShow));
  }, []);

  // Matrix ready callback - will be set by Matrix component
  const matrixReadyCallbackRef = useRef<(() => void) | null>(null);
  const handleMatrixReady = useCallback((callback: (() => void) | null) => {
    matrixReadyCallbackRef.current =
      typeof callback === "function" ? callback : null;
  }, []);

  useEffect(() => {
    if (!showMatrix) {
      return;
    }

    matrixReadyCallbackRef.current?.();
  }, [showMatrix]);

  const hasRenderableContent =
    db.about.length > 0 || db.projects.length > 0 || db.work.length > 0;
  const showUnavailableState = !loading && !hasRenderableContent;
  // Moire + page shell mount immediately; do not wait for Notion or tie visibility to the loader.
  const isBackgroundVisible = true;
  const canRevealInitialLoader =
    isInitialLoaderVisible && hasMinimumLoaderDurationElapsed;
  const handleInitialLoaderExit = useCallback(() => {
    setIsInitialLoaderVisible(false);
  }, []);

  // --- Render ---
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
            <MainRoutes
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
};

// * App entry point
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
