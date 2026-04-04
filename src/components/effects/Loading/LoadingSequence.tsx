import { useEffect, useRef } from "react";
import styled from "styled-components";

/** Matches historical LoadingSequence timing (see git 1d27ad2d / 5bdf3f39). */
const REVEAL_MASKS_MS = 500;
const COMPLETE_MS = 2000;
const REDUCED_COMPLETE_MS = 150;

const MaskCommon = styled.div`
  position: fixed;
  left: 0;
  width: 100%;
  height: 50%;
  background: #999;
  z-index: 20000;
  transition: transform 1s ease-in-out;
  mix-blend-mode: difference;
`;

const MaskTop = styled(MaskCommon)`
  top: 0;
  transform-origin: top;
`;

const MaskBottom = styled(MaskCommon)`
  bottom: 0;
  transform-origin: bottom;
`;

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
  const revealStartedRef = useRef(false);
  const maskTopRef = useRef<HTMLDivElement>(null);
  const maskBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      revealStartedRef.current = false;
    }
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
    if (!isVisible || !isReadyToReveal || revealStartedRef.current) {
      return;
    }

    revealStartedRef.current = true;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      const done = window.setTimeout(() => {
        if (maskTopRef.current) {
          maskTopRef.current.style.display = "none";
        }
        if (maskBottomRef.current) {
          maskBottomRef.current.style.display = "none";
        }
        onExitComplete?.();
      }, REDUCED_COMPLETE_MS);

      return () => window.clearTimeout(done);
    }

    const maskTop = maskTopRef.current;
    const maskBottom = maskBottomRef.current;

    const t1 = window.setTimeout(() => {
      if (maskTop) {
        maskTop.style.transform = "scaleY(0)";
      }
      if (maskBottom) {
        maskBottom.style.transform = "scaleY(0)";
      }
    }, REVEAL_MASKS_MS);

    const t3 = window.setTimeout(() => {
      if (maskTop) {
        maskTop.style.display = "none";
      }
      if (maskBottom) {
        maskBottom.style.display = "none";
      }
      document.body.style.overflow = "";
      onExitComplete?.();
    }, COMPLETE_MS);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t3);
      if (maskTop) {
        maskTop.style.transform = "";
        maskTop.style.display = "";
      }
      if (maskBottom) {
        maskBottom.style.transform = "";
        maskBottom.style.display = "";
      }
    };
  }, [isVisible, isReadyToReveal, onExitComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <MaskTop
        ref={maskTopRef}
        id="MaskTop"
        aria-hidden="true"
        data-testid="site-loader"
      />
      <MaskBottom ref={maskBottomRef} id="MaskBottom" aria-hidden="true" />
    </>
  );
};

export default LoadingSequence;
