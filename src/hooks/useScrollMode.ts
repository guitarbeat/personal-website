import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_SCROLL_SPEED = 400;
const MAX_SCROLL_SPEED = 2000;
const SCROLL_ACCELERATION = 40;

export function useScrollMode() {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const [isInScroll, setIsInScroll] = useState(false);
  const scrollAnimationRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(INITIAL_SCROLL_SPEED);

  const cleanupScrollAnimation = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    scrollSpeedRef.current = INITIAL_SCROLL_SPEED;
  }, []);

  const activateScrollMode = useCallback(() => {
    setIsScrollMode(true);
  }, []);

  useEffect(() => {
    if (!isScrollMode) {
      cleanupScrollAnimation();
      return;
    }

    const scrollStep = () => {
      window.scrollBy({
        top: scrollSpeedRef.current,
        left: 0,
        behavior: "auto",
      });
      scrollSpeedRef.current = Math.min(
        scrollSpeedRef.current + SCROLL_ACCELERATION,
        MAX_SCROLL_SPEED,
      );
      scrollAnimationRef.current = requestAnimationFrame(scrollStep);
    };

    scrollSpeedRef.current = INITIAL_SCROLL_SPEED;
    scrollAnimationRef.current = requestAnimationFrame(scrollStep);
    return cleanupScrollAnimation;
  }, [isScrollMode, cleanupScrollAnimation]);

  useEffect(() => {
    if (!isScrollMode && !isInScroll) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      const isToggleKey = key === "Enter" || key === " " || key === "Spacebar";

      if (!isToggleKey) {
        return;
      }

      if (key !== "Enter") {
        event.preventDefault();
      }

      if (isScrollMode) {
        setIsScrollMode(false);
        setIsInScroll(true);
      } else if (isInScroll) {
        setIsInScroll(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScrollMode, isInScroll]);

  return {
    isScrollMode,
    isInScroll,
    activateScrollMode,
  };
}
