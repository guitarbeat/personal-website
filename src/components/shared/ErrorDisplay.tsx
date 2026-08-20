interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;

  return (
    <div className="error-message">
      <p>{error}</p>


    </div>
  );
};

export default ErrorDisplay;
