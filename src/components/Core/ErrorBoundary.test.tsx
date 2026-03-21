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
    // Need to use verify writable/configurable property for window.location in JSDOM
    // biome-ignore lint/suspicious/noExplicitAny: Mocking read-only property
    delete (window as any).location;
    // biome-ignore lint/suspicious/noExplicitAny: Mocking read-only property
    window.location = { ...originalLocation, reload: jest.fn() } as any;
  });

  afterAll(() => {
    console.error = originalConsoleError;
    window.location = originalLocation;
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
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error: Test Error")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("hides error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // In production, the detailed error message should not be present
    expect(screen.queryByText("Error: Test Error")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
