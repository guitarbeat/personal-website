import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "@/utils/commonUtils";

export function useDraggableNavbar() {
  const navbarRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // * Check if navbar content overflows and needs dragging
  useEffect(() => {
    if (!navbarRef.current) return;

    const checkOverflow = () => {
      const element = navbarRef.current;
      if (element) {
        const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;
        setHasOverflow(hasHorizontalOverflow);
      }
    };

    const debouncedCheckOverflow = debounce(checkOverflow, 200);

    // ! Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkOverflow, 0);
    window.addEventListener("resize", debouncedCheckOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedCheckOverflow);
    };
  }, []);

  // Touch event handlers for dragging
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!navbarRef.current) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - navbarRef.current.offsetLeft);
    setScrollLeft(navbarRef.current.scrollLeft);
    navbarRef.current.classList.add("dragging");

    // Prevent default scrolling behavior
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !navbarRef.current) return;

      e.preventDefault();
      const x = e.touches[0].pageX - navbarRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Reduced scroll speed for smoother experience
      navbarRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleTouchEnd = useCallback(() => {
    if (!navbarRef.current) return;

    setIsDragging(false);
    navbarRef.current.classList.remove("dragging");

    // Add momentum scrolling effect
    const currentScrollLeft = navbarRef.current.scrollLeft;
    const maxScrollLeft =
      navbarRef.current.scrollWidth - navbarRef.current.clientWidth;

    // Snap to edges if close enough
    if (currentScrollLeft < 50) {
      navbarRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else if (currentScrollLeft > maxScrollLeft - 50) {
      navbarRef.current.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    }
  }, []);

  // Mouse event handlers for desktop dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!navbarRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - navbarRef.current.offsetLeft);
    setScrollLeft(navbarRef.current.scrollLeft);
    navbarRef.current.classList.add("dragging");
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !navbarRef.current) return;

      e.preventDefault();
      const x = e.pageX - navbarRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Consistent with touch
      navbarRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleMouseUp = useCallback(() => {
    if (!navbarRef.current) return;

    setIsDragging(false);
    navbarRef.current.classList.remove("dragging");

    // Add momentum scrolling effect
    const currentScrollLeft = navbarRef.current.scrollLeft;
    const maxScrollLeft =
      navbarRef.current.scrollWidth - navbarRef.current.clientWidth;

    // Snap to edges if close enough
    if (currentScrollLeft < 50) {
      navbarRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else if (currentScrollLeft > maxScrollLeft - 50) {
      navbarRef.current.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    }
  }, []);

  return useMemo(
    () => ({
      navbarRef,
      hasOverflow,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    }),
    [
      hasOverflow,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    ],
  );
}
