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
    expect(screen.queryByText("Environment Variables Required")).not.toBeInTheDocument();
    expect(screen.queryByText("Proxy Configuration Issue")).not.toBeInTheDocument();
  });

  it("renders environment variable help when error contains 'not set'", () => {
    const errorMessage = "API key not set";
    render(<ErrorDisplay error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText("Environment Variables Required")).toBeInTheDocument();
    expect(screen.getByText(/REACT_APP_PRINTFUL_API_KEY/)).toBeInTheDocument();
  });

  it("renders proxy configuration help when error contains 'CORS Error'", () => {
    const errorMessage = "CORS Error: request blocked";
    render(<ErrorDisplay error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText("Proxy Configuration Issue")).toBeInTheDocument();
    expect(screen.getByText(/The application is configured to use a proxy/)).toBeInTheDocument();
  });
});
