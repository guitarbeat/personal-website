import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { UnlockProvider } from "../effects/Matrix/UnlockContext";
import {
  ContentUnavailableState,
  SiteLayout,
  SiteStatusPill,
} from "./SiteLayout";

jest.mock("../effects/Loading/FrameEffect", () => {
  return ({ children }: { children: React.ReactNode }) => (
    <div data-testid="frame-effect">{children}</div>
  );
});

jest.mock("../effects/Matrix/ScrollToTopButton", () => {
  return () => (
    <button type="button" data-testid="scroll-to-top">
      Scroll to top
    </button>
  );
});

jest.mock("../effects/Moire/Moire", () => {
  return ({ isVisible }: { isVisible: boolean }) => (
    <div data-testid="moire-effect">{isVisible ? "visible" : "hidden"}</div>
  );
});

jest.mock("../index", () => ({
  NavBar: ({ items }: { items: Record<string, string> }) => (
    <nav data-testid="nav-bar">{Object.keys(items).join(",")}</nav>
  ),
}));

describe("SiteStatusPill", () => {
  it("renders status pill text", () => {
    render(<SiteStatusPill />);
    expect(
      screen.getByText("Showing cached content. Live refresh is unavailable."),
    ).toBeInTheDocument();
  });
});

describe("ContentUnavailableState", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: jest.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  it("renders content unavailable message and reloads page on click", () => {
    render(<ContentUnavailableState error="Failed to fetch" />);
    expect(screen.getByText("Content unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("Site content is temporarily unavailable."),
    ).toBeInTheDocument();

    const reloadButton = screen.getByText("Reload page");
    fireEvent.click(reloadButton);
    expect(window.location.reload).toHaveBeenCalled();
  });
});

describe("SiteLayout", () => {
  const mockProps = {
    navItems: { Home: "/" },
    onMatrixActivate: jest.fn(),
    isInScroll: false,
    hideNavBar: false,
    isDegraded: false,
    isBackgroundVisible: true,
  };

  it("renders layout with children and navigation bar when not hidden", () => {
    render(
      <UnlockProvider>
        <SiteLayout {...mockProps}>
          <div>Test Content</div>
        </SiteLayout>
      </UnlockProvider>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByTestId("nav-bar")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders status pill when degraded", () => {
    render(
      <UnlockProvider>
        <SiteLayout {...mockProps} isDegraded={true}>
          <div>Test Content</div>
        </SiteLayout>
      </UnlockProvider>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides nav bar when hideNavBar is true", () => {
    render(
      <UnlockProvider>
        <SiteLayout {...mockProps} hideNavBar={true}>
          <div>Test Content</div>
        </SiteLayout>
      </UnlockProvider>,
    );

    expect(screen.queryByTestId("nav-bar")).not.toBeInTheDocument();
  });
});
