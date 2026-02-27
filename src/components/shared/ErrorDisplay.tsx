interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;

  return (
    <div className="error-message">
      <p>{error}</p>
      {error.includes("Network Error") && (
        <div className="env-help">
          <h3>Backend Connection Issue</h3>
          <p>
            The application is unable to connect to the backend server.
          </p>
          <p>Please ensure:</p>
          <ul>
            <li>
              You are connected to the internet.
            </li>
            <li>
              The backend API server is running and accessible.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
