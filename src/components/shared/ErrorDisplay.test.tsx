import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ErrorDisplay from "./ErrorDisplay";

describe("ErrorDisplay", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the error message when a generic error is passed", () => {
    const errorMessage = "Something went wrong";
    render(<ErrorDisplay error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(
      screen.queryByText("Environment Variables Required"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Proxy Configuration Issue"),
    ).not.toBeInTheDocument();
  });




});
