import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockUseMobileDetection = jest.fn();
const mockProofCompanion = jest.fn();

jest.mock("@/hooks/useMobileDetection", () => ({
  useMobileDetection: () => mockUseMobileDetection(),
}));

jest.mock("@/vendor/proof", () => {
  const React = require("react");
  return {
    __esModule: true,
    ProofCompanion: (props: {
      size?: number;
      placement?: string;
      inset?: number;
      persistPosition?: boolean;
      storageKey?: string;
      style?: { zIndex?: string | number };
      "aria-label"?: string;
    }) => {
      mockProofCompanion(props);
      return React.createElement("div", {
        "data-testid": "proof-companion",
        "data-size": props.size,
        "data-placement": props.placement,
        "data-inset": props.inset,
        "data-persist": props.persistPosition ? "true" : "false",
        "data-storage-key": props.storageKey,
        "data-z-index":
          props.style?.zIndex == null ? undefined : String(props.style.zIndex),
        role: "img",
        "aria-label": props["aria-label"],
      });
    },
  };
});

import { SiteProof } from "./SiteProof";
import { canMountSiteProof } from "./siteProofMount";

describe("canMountSiteProof", () => {
  it("requires unlock, exited loader, and closed Matrix", () => {
    expect(
      canMountSiteProof({
        isUnlocked: true,
        isInitialLoaderVisible: false,
        showMatrix: false,
      }),
    ).toBe(true);
    expect(
      canMountSiteProof({
        isUnlocked: false,
        isInitialLoaderVisible: false,
        showMatrix: false,
      }),
    ).toBe(false);
    expect(
      canMountSiteProof({
        isUnlocked: true,
        isInitialLoaderVisible: true,
        showMatrix: false,
      }),
    ).toBe(false);
    expect(
      canMountSiteProof({
        isUnlocked: true,
        isInitialLoaderVisible: false,
        showMatrix: true,
      }),
    ).toBe(false);
  });
});

describe("SiteProof", () => {
  beforeEach(() => {
    mockProofCompanion.mockClear();
    mockUseMobileDetection.mockReset();
    mockUseMobileDetection.mockReturnValue({ isMobile: false });
  });

  it("mounts Proof at desktop size with site stacking and persistence", () => {
    render(<SiteProof />);

    const companion = screen.getByTestId("proof-companion");
    expect(companion).toHaveAttribute("data-size", "208");
    expect(companion).toHaveAttribute("data-placement", "bottom-right");
    expect(companion).toHaveAttribute("data-inset", "72");
    expect(companion).toHaveAttribute("data-persist", "true");
    expect(companion).toHaveAttribute(
      "data-storage-key",
      "woods-engineer-proof-position",
    );
    expect(companion).toHaveAttribute("data-z-index", "var(--z-index-proof)");
    expect(companion).toHaveAttribute("aria-label", "Proof, site companion");
    expect(mockProofCompanion).toHaveBeenCalled();
  });

  it("uses the mobile size on narrow viewports", () => {
    mockUseMobileDetection.mockReturnValue({ isMobile: true });

    render(<SiteProof />);

    expect(screen.getByTestId("proof-companion")).toHaveAttribute(
      "data-size",
      "160",
    );
  });
});
