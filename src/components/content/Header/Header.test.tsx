import "@testing-library/jest-dom";
import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

jest.mock("./useScrambleEffect", () => jest.fn());

import { AVATAR_TRANSITION_FALLBACK_MS } from "./avatarTransition.constants";
import Header from "./Header";

describe("Header avatar", () => {
  beforeEach(() => {
    sessionStorage.removeItem("header-profile-index");
    jest.useFakeTimers();
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 0;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it("renders the avatar button without the removed chat bubble hint", () => {
    const { container } = render(<Header />);

    expect(
      screen.getByRole("button", { name: /change profile image/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".chat-bubble")).toBeNull();
    expect(container.querySelectorAll(".avatar__photo--active")).toHaveLength(
      1,
    );

    const avatar = container.querySelector<HTMLImageElement>(
      ".avatar__photo--active",
    );
    expect(avatar).toHaveAttribute("fetchpriority", "high");
  });

  it("shows one avatar at a time during phased transition", async () => {
    const { container } = render(<Header />);
    const avatarButton = screen.getByRole("button", {
      name: /change profile image/i,
    });

    act(() => {
      fireEvent.click(avatarButton);
    });

    expect(container.querySelectorAll(".avatar__photo")).toHaveLength(1);
    expect(
      container.querySelector(".avatar__photo--outgoing"),
    ).toBeInTheDocument();
    expect(container.querySelector(".avatar__photo--incoming")).toBeNull();
    expect(
      container.querySelector(".avatar--transitioning"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".avatar")).toHaveLength(1);

    const outgoing = container.querySelector(".avatar__photo--outgoing");
    expect(outgoing).not.toBeNull();

    act(() => {
      fireEvent(
        outgoing as Element,
        createEvent.transitionEnd(outgoing as Element, {
          propertyName: "transform",
        }),
      );
    });

    await waitFor(() => {
      expect(container.querySelectorAll(".avatar__photo")).toHaveLength(1);
      expect(
        container.querySelector(".avatar__photo--incoming"),
      ).toBeInTheDocument();
      expect(container.querySelector(".avatar__photo--outgoing")).toBeNull();
    });
  });

  it("cycles through profile images and wraps back to the starting avatar", async () => {
    const { container } = render(<Header />);
    const avatarButton = screen.getByRole("button", {
      name: /change profile image/i,
    });
    const profileImageCount = 4;
    const getActiveAvatar = () =>
      container.querySelector<HTMLImageElement>(".avatar__photo--active");

    expect(
      container.querySelectorAll<HTMLImageElement>(".avatar__photo"),
    ).toHaveLength(1);

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
    expect(container.querySelectorAll(".avatar__photo--active")).toHaveLength(
      1,
    );

    for (let clickCount = 1; clickCount < profileImageCount; clickCount += 1) {
      fireEvent.click(avatarButton);

      await act(async () => {
        jest.advanceTimersByTime(AVATAR_TRANSITION_FALLBACK_MS);
      });
    }

    expect(getActiveAvatar()?.getAttribute("src")).toBe(initialSrc);
    expect(container.querySelectorAll(".avatar__photo--active")).toHaveLength(
      1,
    );
  });
});
