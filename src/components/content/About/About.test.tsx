import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

jest.mock("@/hooks/useNotionSectionData", () => ({
  useNotionSectionData: () => ({
    db: {
      about: [{ category: "Bio", description: "Hello world" }],
    },
    isLoading: false,
  }),
}));

jest.mock("@/hooks/useSpotifyWidget", () => ({
  useSpotifyWidget: () => ({
    handleSpotifyClick: jest.fn(),
  }),
}));

describe("About Component", () => {
  it("renders heading and section content correctly", () => {
    render(<About />);
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(screen.getByText("Bio")).toBeInTheDocument();
  });

  it("renders Spotify widget link", () => {
    render(<About />);
    const spotifyLink = screen.getByRole("link", {
      name: /view spotify profile/i,
    });
    expect(spotifyLink).toBeInTheDocument();
  });
});
