import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // Import custom matchers
import Matrix from "../Matrix";
import { UnlockProvider } from "../UnlockContext";

describe("Matrix", () => {
  it("does not render the test easter egg button", () => {
    // Mock canvas context
    const mockGetContext = jest.fn();
    HTMLCanvasElement.prototype.getContext = mockGetContext;

    // Mock audio
    window.HTMLMediaElement.prototype.play = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = jest.fn();

    render(
      <UnlockProvider>
        <Matrix isVisible={true} />
      </UnlockProvider>,
    );
    const button = screen.queryByRole("button", { name: /test easter egg/i });
    expect(button).not.toBeInTheDocument();
  });
});
