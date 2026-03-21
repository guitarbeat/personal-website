import { fireEvent, render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";
import "@testing-library/jest-dom";

// Component that throws an error
const ThrowError = () => {
  throw new Error("Test Error");
};

describe("ErrorBoundary", () => {
  const originalConsoleError = console.error;
  const originalLocation = window.location;

  beforeAll(() => {
    // Suppress console.error for these tests as we expect errors
    console.error = jest.fn();

    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: jest.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterAll(() => {
    console.error = originalConsoleError;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Safe Content")).toBeInTheDocument();
  });

  it("catches error and displays fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("reloads the page when Reload button is clicked", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByText("Reload Page");
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it("displays error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error: Test Error")).toBeInTheDocument();

    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      configurable: true,
    });
  });

  it("hides error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // In production, the detailed error message should not be present
    expect(screen.queryByText("Error: Test Error")).not.toBeInTheDocument();

    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      configurable: true,
    });
  });
});
