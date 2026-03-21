import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("./useScrambleEffect", () => jest.fn());

import Header from "./Header";

describe("Header avatar", () => {
  it("renders the avatar button without the removed chat bubble hint", () => {
    const { container } = render(<Header />);

    expect(
      screen.getByRole("button", { name: /change profile image/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".chat-bubble")).toBeNull();
    expect(container.querySelectorAll(".avatar.active")).toHaveLength(1);
  });

  it("cycles through profile images and wraps back to the starting avatar", () => {
    const { container } = render(<Header />);
    const avatarButton = screen.getByRole("button", {
      name: /change profile image/i,
    });
    const avatars = Array.from(
      container.querySelectorAll<HTMLImageElement>(".avatar"),
    );
    const getActiveAvatar = () =>
      container.querySelector<HTMLImageElement>(".avatar.active");

    expect(avatars.length).toBeGreaterThan(1);

    const initialAvatar = getActiveAvatar();
    expect(initialAvatar).not.toBeNull();

    const initialSrc = initialAvatar?.getAttribute("src");

    fireEvent.click(avatarButton);

    const nextAvatar = getActiveAvatar();
    expect(nextAvatar).not.toBeNull();
    expect(nextAvatar?.getAttribute("src")).not.toBe(initialSrc);
    expect(container.querySelectorAll(".avatar.active")).toHaveLength(1);

    for (let clickCount = 1; clickCount < avatars.length; clickCount += 1) {
      fireEvent.click(avatarButton);
    }

    expect(getActiveAvatar()?.getAttribute("src")).toBe(initialSrc);
    expect(container.querySelectorAll(".avatar.active")).toHaveLength(1);
  });
});
