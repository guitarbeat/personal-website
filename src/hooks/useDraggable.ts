import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "@/utils/commonUtils";

export function useDraggable<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if element content overflows horizontally
  useEffect(() => {
    if (!elementRef.current) return;

    const checkOverflow = () => {
      const element = elementRef.current;
      if (element) {
        const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;
        setHasOverflow(hasHorizontalOverflow);
      }
    };

    const debouncedCheckOverflow = debounce(checkOverflow, 200);

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkOverflow, 0);
    window.addEventListener("resize", debouncedCheckOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedCheckOverflow);
    };
  }, []);

  // Touch event handlers for mobile dragging
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!elementRef.current) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - elementRef.current.offsetLeft);
    setScrollLeft(elementRef.current.scrollLeft);
    elementRef.current.classList.add("dragging");

    // Prevent default scrolling behavior
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !elementRef.current) return;

      e.preventDefault();
      const x = e.touches[0].pageX - elementRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Reduced scroll speed for smoother experience
      elementRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleTouchEnd = useCallback(() => {
    if (!elementRef.current) return;

    setIsDragging(false);
    elementRef.current.classList.remove("dragging");

    // Add momentum scrolling effect
    const currentScrollLeft = elementRef.current.scrollLeft;
    const maxScrollLeft =
      elementRef.current.scrollWidth - elementRef.current.clientWidth;

    // Snap to edges if close enough
    if (currentScrollLeft < 50) {
      elementRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else if (currentScrollLeft > maxScrollLeft - 50) {
      elementRef.current.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    }
  }, []);

  // Mouse event handlers for desktop dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - elementRef.current.offsetLeft);
    setScrollLeft(elementRef.current.scrollLeft);
    elementRef.current.classList.add("dragging");
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !elementRef.current) return;

      e.preventDefault();
      const x = e.pageX - elementRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Consistent with touch
      elementRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleMouseUp = useCallback(() => {
    if (!elementRef.current) return;

    setIsDragging(false);
    elementRef.current.classList.remove("dragging");

    // Add momentum scrolling effect
    const currentScrollLeft = elementRef.current.scrollLeft;
    const maxScrollLeft =
      elementRef.current.scrollWidth - elementRef.current.clientWidth;

    // Snap to edges if close enough
    if (currentScrollLeft < 50) {
      elementRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else if (currentScrollLeft > maxScrollLeft - 50) {
      elementRef.current.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    }
  }, []);

  return {
    elementRef,
    isDragging,
    hasOverflow,
    dragProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}
