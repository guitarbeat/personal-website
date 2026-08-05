/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/commonUtils";
import { prefersReducedMotion } from "@/utils/motion";
import "./custom-cursor.scss";

type CustomCursorProps = {
  /**
   * Text shown in the cursor when hovering "clickable" elements (buttons/links or `[data-hover="true"]`).
   * Defaults to "View".
   */
  label?: string;
};

function isCustomCursorSupported(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  if (prefersReducedMotion()) {
    return false;
  }

  return (
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

function useCustomCursorSupport() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncEnabled = () => {
      setEnabled(isCustomCursorSupported());
    };

    syncEnabled();

    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const hoverQuery = window.matchMedia("(hover: hover)");

    reducedMotionQuery.addEventListener("change", syncEnabled);
    pointerQuery.addEventListener("change", syncEnabled);
    hoverQuery.addEventListener("change", syncEnabled);

    return () => {
      reducedMotionQuery.removeEventListener("change", syncEnabled);
      pointerQuery.removeEventListener("change", syncEnabled);
      hoverQuery.removeEventListener("change", syncEnabled);
    };
  }, []);

  return enabled;
}

function useCustomCursorEvents(
  enabled: boolean,
  defaultLabel: string,
  cursorRef: React.RefObject<HTMLDivElement | null>,
) {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState(defaultLabel);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const cursor = cursorRef.current;
    if (!cursor) {
      return undefined;
    }

    const updateMousePosition = (event: MouseEvent) => {
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const customTextElement = target.closest("[data-cursor-text]");
      if (customTextElement) {
        const text = customTextElement.getAttribute("data-cursor-text");
        if (text) {
          setCursorText(text);
          setIsHovering(true);
          return;
        }
      }

      const clickable =
        target.closest("button") ??
        target.closest("a") ??
        target.closest('[data-hover="true"]');

      if (clickable) {
        setCursorText(defaultLabel);
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener("mousemove", updateMousePosition, {
      passive: true,
    });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [defaultLabel, enabled, cursorRef]);

  return { isHovering, cursorText };
}

const CustomCursor = ({ label: defaultLabel = "View" }: CustomCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const enabled = useCustomCursorSupport();
  const { isHovering, cursorText } = useCustomCursorEvents(
    enabled,
    defaultLabel,
    cursorRef,
  );

  if (!enabled) {
    return null;
  }

  return (
    <div ref={cursorRef} className="custom-cursor">
      <div
        className={cn(
          "custom-cursor__body",
          isHovering && "custom-cursor__body--hover",
        )}
      >
        <span
          className={cn(
            "custom-cursor__label",
            isHovering && "custom-cursor__label--visible",
          )}
        >
          {cursorText}
        </span>
      </div>
    </div>
  );
};

export default CustomCursor;
