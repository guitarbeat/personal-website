import { useEffect, useRef, useState } from "react";

import "./loading-sequence.scss";

const INITIAL_LOADER_ID = "initial-loader";
const STATIC_SHELL_HANDOFF_MS = 180;
const DEFAULT_EXIT_DURATION_MS = 1100;
const REDUCED_MOTION_EXIT_DURATION_MS = 260;

const getExitDuration = () => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return REDUCED_MOTION_EXIT_DURATION_MS;
  }

  return DEFAULT_EXIT_DURATION_MS;
};

interface LoadingSequenceProps {
  isVisible: boolean;
  isReadyToReveal: boolean;
  onExitComplete?: () => void;
}

const LoadingSequence = ({
  isVisible,
  isReadyToReveal,
  onExitComplete,
}: LoadingSequenceProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const hasStartedExitRef = useRef(false);

  useEffect(() => {
    if (!isVisible) {
      hasStartedExitRef.current = false;
      setIsExiting(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const initialLoader = document.getElementById(INITIAL_LOADER_ID);
    if (!initialLoader) {
      return;
    }

    initialLoader.setAttribute("data-react-mounted", "true");

    const cleanupTimeout = window.setTimeout(() => {
      initialLoader.remove();
    }, STATIC_SHELL_HANDOFF_MS);

    return () => window.clearTimeout(cleanupTimeout);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !isReadyToReveal || hasStartedExitRef.current) {
      return;
    }

    hasStartedExitRef.current = true;
    setIsExiting(true);

    const exitTimeout = window.setTimeout(() => {
      onExitComplete?.();
    }, getExitDuration());

    return () => {
      window.clearTimeout(exitTimeout);
    };
  }, [isVisible, isReadyToReveal, onExitComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`loading-sequence${isExiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
      data-testid="site-loader"
    >
      <div
        className="loading-sequence__veil loading-sequence__veil--top"
        aria-hidden="true"
      />
      <div
        className="loading-sequence__veil loading-sequence__veil--bottom"
        aria-hidden="true"
      />
      <div className="loading-sequence__frame" aria-hidden="true" />
      <div className="loading-sequence__frame-inner" aria-hidden="true" />
      <div className="loading-sequence__content">
        <p className="loading-sequence__eyebrow">Loading portfolio</p>
        <h1 className="loading-sequence__title">Aaron Lorenzo Woods</h1>
        <p className="loading-sequence__meta">Engineer Artist Scientist</p>
        <div className="loading-sequence__signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default LoadingSequence;
