import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { UnlockProvider } from "../../effects/Matrix/UnlockContext";
import NavBar from "./NavBar";

jest.mock(
  "react-router-dom",
  () => {
    return {
      Link: ({
        to,
        children,
        onClick,
      }: {
        to: string;
        children: ReactNode;
        onClick?: (e: React.MouseEvent) => void;
      }) => (
        <a href={to} onClick={onClick}>
          {children}
        </a>
      ),
    };
  },
  { virtual: true },
);

describe("NavBar", () => {
  const defaultItems = { Home: "/", About: "/#about", Work: "/#work" };
  const mockOnMatrixActivate = jest.fn();

  it("renders navigation items correctly", () => {
    render(
      <UnlockProvider>
        <NavBar items={defaultItems} onMatrixActivate={mockOnMatrixActivate} />
      </UnlockProvider>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("renders theme switch button and handles theme toggle", () => {
    render(
      <UnlockProvider>
        <NavBar items={defaultItems} onMatrixActivate={mockOnMatrixActivate} />
      </UnlockProvider>,
    );

    const themeSwitch = screen.getByRole("switch");
    expect(themeSwitch).toBeInTheDocument();
    fireEvent.click(themeSwitch);
  });
});
