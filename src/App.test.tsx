import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const mockUseNotion = jest.fn();

jest.mock(
  "@vercel/analytics/react",
  () => ({
    Analytics: () => null,
  }),
  { virtual: true },
);

jest.mock(
  "@vercel/speed-insights/react",
  () => ({
    SpeedInsights: () => null,
  }),
  { virtual: true },
);

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    return {
      BrowserRouter: ({ children }: { children: ReactNode }) => children,
      Routes: ({ children }: { children: ReactNode }) => {
        const routeChildren = React.Children.toArray(children);
        const activeRoute = routeChildren.find(
          // biome-ignore lint/suspicious/noExplicitAny: Test-only route stub
          (child: any) =>
            React.isValidElement(child) && child.props.path === "/",
        );

        return activeRoute ? activeRoute.props.element : null;
      },
      Route: () => null,
      Navigate: () => null,
      useLocation: () => ({
        pathname: "/",
        search: "",
        hash: "",
      }),
      useNavigate: () => jest.fn(),
    };
  },
  { virtual: true },
);

jest.mock("./contexts/NotionContext", () => ({
  NotionProvider: ({ children }: { children: ReactNode }) => children,
  useNotion: () => mockUseNotion(),
}));

jest.mock("./components/index", () => ({
  Header: () => <div>Header section</div>,
  About: () => <div>About section</div>,
  Projects: () => <div>Projects section</div>,
  Work: () => <div>Work section</div>,
  NavBar: () => <div>Navigation</div>,
}));

jest.mock("./components/effects/Blur/index", () => ({
  BlurSection: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("./components/effects/CustomCursor/CustomCursor", () => () => null);
jest.mock("./components/effects/InfiniteScrollEffect", () => {
  return ({ children }: { children: ReactNode }) => children;
});
jest.mock("./components/effects/Loading/FrameEffect", () => {
  return ({ children }: { children: ReactNode }) => children;
});
jest.mock("./components/effects/Loading/LoadingSequence", () => {
  const React = require("react");

  return {
    __esModule: true,
    default: ({
      isVisible,
      isReadyToReveal,
      onExitComplete,
    }: {
      isVisible: boolean;
      isReadyToReveal: boolean;
      onExitComplete?: () => void;
    }) => {
      React.useEffect(() => {
        if (isVisible && isReadyToReveal) {
          onExitComplete?.();
        }
      }, [isVisible, isReadyToReveal, onExitComplete]);

      return isVisible ? <div role="status">Loading portfolio</div> : null;
    },
  };
});
jest.mock("./components/effects/Matrix/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    isUnlocked: false,
  }),
}));
jest.mock("./components/effects/Matrix/Matrix", () => () => null);
jest.mock("./components/effects/Matrix/ScrollToTopButton", () => () => null);
jest.mock("./components/effects/Moire/Moire", () => () => null);

import App from "./App";

describe("App reliability states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders the branded loader while initial content is still loading", () => {
    mockUseNotion.mockReturnValue({
      db: {
        about: [],
        projects: [],
        work: [],
      },
      meta: null,
      loading: true,
      error: null,
      isDegraded: false,
      lastUpdated: null,
    });

    render(<App />);

    expect(screen.getByText("Loading portfolio")).toBeInTheDocument();
    expect(screen.queryByText("Header section")).not.toBeInTheDocument();
  });

  it("renders a degraded-status pill while cached content is displayed", () => {
    mockUseNotion.mockReturnValue({
      db: {
        about: [{ category: "Bio", description: "Hello" }],
        projects: [],
        work: [],
      },
      meta: {
        source: "snapshot",
        degraded: true,
        fetchedAt: "2026-03-21T12:00:00.000Z",
        snapshotUpdatedAt: "2026-03-21T10:00:00.000Z",
        snapshotAgeSeconds: 7200,
        schemaVersion: 3,
      },
      loading: false,
      error: null,
      isDegraded: true,
      lastUpdated: "2026-03-21T10:00:00.000Z",
    });

    render(<App />);

    expect(
      screen.getByText("Showing cached content. Live refresh is unavailable."),
    ).toBeInTheDocument();
    expect(screen.getByText("Header section")).toBeInTheDocument();
  });

  it("dismisses the loader after the minimum intro duration once content is ready", () => {
    mockUseNotion.mockReturnValue({
      db: {
        about: [{ category: "Bio", description: "Hello" }],
        projects: [],
        work: [],
      },
      meta: {
        source: "live",
        degraded: false,
        fetchedAt: "2026-03-21T12:00:00.000Z",
        snapshotUpdatedAt: null,
        snapshotAgeSeconds: null,
        schemaVersion: 3,
      },
      loading: false,
      error: null,
      isDegraded: false,
      lastUpdated: "2026-03-21T12:00:00.000Z",
    });

    render(<App />);

    expect(screen.getByText("Loading portfolio")).toBeInTheDocument();
    expect(screen.getByText("Header section")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText("Loading portfolio")).not.toBeInTheDocument();
  });

  it("reveals the unavailable state after loading resolves with no content", () => {
    mockUseNotion.mockReturnValue({
      db: {
        about: [],
        projects: [],
        work: [],
      },
      meta: null,
      loading: false,
      error: "Live content refresh failed and no cached snapshot is available.",
      isDegraded: false,
      lastUpdated: null,
    });

    render(<App />);

    expect(screen.getByText("Loading portfolio")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(
      screen.getByText("Site content is temporarily unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading portfolio")).not.toBeInTheDocument();
    expect(screen.queryByText("Header section")).not.toBeInTheDocument();
  });
});
