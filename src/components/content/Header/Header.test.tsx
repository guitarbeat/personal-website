import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

jest.mock("./useScrambleEffect", () => jest.fn());

import Header from "./Header";

const AVATAR_TRANSITION_FALLBACK_MS = 500;

describe("Header avatar", () => {
  beforeEach(() => {
    sessionStorage.removeItem("header-profile-index");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the avatar button without the removed chat bubble hint", () => {
    const { container } = render(<Header />);

    expect(
      screen.getByRole("button", { name: /change profile image/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".chat-bubble")).toBeNull();
    expect(container.querySelectorAll(".avatar--active")).toHaveLength(1);

    const avatar = container.querySelector<HTMLImageElement>(".avatar--active");
    expect(avatar).toHaveAttribute("fetchpriority", "high");
  });

  it("shows two avatars during slide transition", () => {
    const { container } = render(<Header />);
    const avatarButton = screen.getByRole("button", {
      name: /change profile image/i,
    });

    fireEvent.click(avatarButton);

    expect(container.querySelectorAll(".avatar")).toHaveLength(2);
    expect(container.querySelector(".avatar--outgoing")).toBeInTheDocument();
    expect(container.querySelector(".avatar--incoming")).toBeInTheDocument();
  });

  it("cycles through profile images and wraps back to the starting avatar", async () => {
    const { container } = render(<Header />);
    const avatarButton = screen.getByRole("button", {
      name: /change profile image/i,
    });
    const profileImageCount = 4;
    const getActiveAvatar = () =>
      container.querySelector<HTMLImageElement>(".avatar--active");

    expect(container.querySelectorAll<HTMLImageElement>(".avatar")).toHaveLength(
      1,
    );

    const initialAvatar = getActiveAvatar();
    expect(initialAvatar).not.toBeNull();

    const initialSrc = initialAvatar?.getAttribute("src");

    fireEvent.click(avatarButton);

    await act(async () => {
      jest.advanceTimersByTime(AVATAR_TRANSITION_FALLBACK_MS);
    });

    await waitFor(() => {
      expect(getActiveAvatar()?.getAttribute("src")).not.toBe(initialSrc);
    });
    expect(container.querySelectorAll(".avatar--active")).toHaveLength(1);

    for (let clickCount = 1; clickCount < profileImageCount; clickCount += 1) {
      fireEvent.click(avatarButton);

      await act(async () => {
        jest.advanceTimersByTime(AVATAR_TRANSITION_FALLBACK_MS);
      });
    }

    expect(getActiveAvatar()?.getAttribute("src")).toBe(initialSrc);
    expect(container.querySelectorAll(".avatar--active")).toHaveLength(1);
  });
});
