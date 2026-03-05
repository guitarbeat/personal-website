/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import "./custom-cursor.scss";

const springConfig = { damping: 20, stiffness: 350, mass: 0.1 };

type CustomCursorProps = {
  /**
   * Text shown in the cursor when hovering "clickable" elements (buttons/links or `[data-hover="true"]`).
   * Defaults to "View".
   */
  label?: string;
};

const CustomCursor = ({ label: defaultLabel = "View" }: CustomCursorProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState(defaultLabel);

  // Initialize off-screen to prevent flash
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring animation
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Throttled using requestAnimationFrame to avoid expensive DOM traversal on every mouseover event
  const rafId = useRef<number | null>(null);
  const lastTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    // 1. Position tracking (high frequency, minimal logic)
    // * Performance optimization: decoupled from state updates to prevent expensive DOM traversal on every frame
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    // 2. Hover state detection (event-driven, no polling on mousemove)
    const processHover = () => {
      const target = lastTarget.current;
      if (!(target instanceof Element)) {
        rafId.current = null;
        return;
      }

      // Check for custom cursor text first
      const customTextElement = target.closest("[data-cursor-text]");
      if (customTextElement) {
        const text = customTextElement.getAttribute("data-cursor-text");
        if (text) {
          setCursorText(text);
          setIsHovering(true);
          rafId.current = null;
          return;
        }
      }

      // Check for clickable elements
      // Optimization: Combined selector to reduce DOM traversal
      const clickable = target.closest('button, a, [data-hover="true"]');

      if (clickable) {
        setCursorText(defaultLabel);
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
      rafId.current = null;
    };

    const handleMouseOver = (e: MouseEvent) => {
      lastTarget.current = e.target;
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(processHover);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    window.addEventListener("mousemove", updateMousePosition, {
      passive: true,
    });
    window.addEventListener("mouseover", handleMouseOver, {
      passive: true,
    });
    document.addEventListener("mouseleave", handleMouseLeave, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [mouseX, mouseY, defaultLabel]);

  return (
    <motion.div
      className="custom-cursor"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
    >
      {/* This div is the actual cursor "body" and will handle the scaling and text centering */}
      <motion.div
        className="custom-cursor__body"
        // Style width/height removed here as handled in CSS, but animating scale is fine to keep here or move to CSS if basic
        // Actually, frame-motion constraints are easier in JS for 'scale'
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Text directly inside the scalable cursor body, centered by flex parent */}
        <motion.span
          className="custom-cursor__label"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {cursorText}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;
