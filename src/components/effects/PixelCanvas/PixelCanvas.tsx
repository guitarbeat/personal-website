import { useEffect, useMemo, useRef } from "react";
import { debounce } from "../../../utils/commonUtils";
import { Pixel } from "./Pixel";

const MAX_DEVICE_PIXEL_RATIO = 2;

const clampGap = (value: number) => {
  const min = 4;
  const max = 50;

  if (value <= min) {
    return min;
  }

  if (value >= max) {
    return max;
  }

  return Math.floor(value);
};

const normalizeSpeed = (value: number, reducedMotion: boolean) => {
  const min = 0;
  const max = 100;
  const throttle = 0.001;

  if (reducedMotion || value <= min) {
    return min;
  }

  if (value >= max) {
    return max * throttle;
  }

  return value * throttle;
};

interface PixelCanvasProps {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  gap?: number;
  speed?: number;
  noFocus?: boolean;
}

const PixelCanvas = ({
  className = "",
  style,
  colors = ["#f8fafc", "#f1f5f9", "#cbd5e1"],
  gap = 5,
  speed = 35,
  noFocus = false,
}: PixelCanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorPalette = useMemo(() => {
    if (!colors || colors.length === 0) {
      return ["#f8fafc", "#f1f5f9", "#cbd5e1"];
    }

    return colors;
  }, [colors]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const parentElement = wrapper.parentElement ?? wrapper;

    const reducedMotion =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

    const parsedGap = clampGap(gap);
    const parsedSpeed = normalizeSpeed(speed, reducedMotion);

    let pixels: Pixel[] = [];
    let logicalWidth = 0;
    let logicalHeight = 0;
    let animationFrameId: number | undefined;
    const getNow = () =>
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();

    let timePrevious = getNow();
    const timeInterval = 1000 / 60;

    const clearAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
      }
    };

    const getDistanceToCanvasCenter = (x: number, y: number) => {
      const dx = x - logicalWidth / 2;
      const dy = y - logicalHeight / 2;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const createPixels = () => {
      pixels = [];
      for (let x = 0; x < logicalWidth; x += parsedGap) {
        for (let y = 0; y < logicalHeight; y += parsedGap) {
          const color =
            colorPalette[Math.floor(Math.random() * colorPalette.length)];
          const delay = reducedMotion ? 0 : getDistanceToCanvasCenter(x, y);

          pixels.push(
            new Pixel(
              context,
              logicalWidth,
              logicalHeight,
              x,
              y,
              color,
              parsedSpeed,
              delay,
            ),
          );
        }
      }
    };

    const init = () => {
      const rect = wrapper.getBoundingClientRect();
      logicalWidth = Math.max(0, Math.floor(rect.width));
      logicalHeight = Math.max(0, Math.floor(rect.height));

      const dpr = Math.min(
        typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1,
        MAX_DEVICE_PIXEL_RATIO,
      );

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;

      createPixels();
    };

    const animate = (fnName: "appear" | "disappear") => {
      animationFrameId = requestAnimationFrame(() => animate(fnName));

      const timeNow = getNow();
      const timePassed = timeNow - timePrevious;

      if (timePassed < timeInterval) {
        return;
      }

      timePrevious = timeNow - (timePassed % timeInterval);
      context.clearRect(0, 0, logicalWidth, logicalHeight);

      for (let i = 0; i < pixels.length; i += 1) {
        pixels[i][fnName]();
      }

      if (pixels.every((pixel) => pixel.isIdle)) {
        clearAnimation();
      }
    };

    const handleAnimation = (name: "appear" | "disappear") => {
      clearAnimation();
      animate(name);
    };

    const handleMouseEnter = () => handleAnimation("appear");
    const handleMouseLeave = () => handleAnimation("disappear");

    const handleFocusIn = (event: FocusEvent) => {
      if (
        (event.currentTarget as HTMLElement | null)?.contains(
          event.relatedTarget as Node | null,
        )
      ) {
        return;
      }

      handleAnimation("appear");
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (
        (event.currentTarget as HTMLElement | null)?.contains(
          event.relatedTarget as Node | null,
        )
      ) {
        return;
      }

      handleAnimation("disappear");
    };

    init();
    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver === "function") {
      // Performance: Debounce resize handler to prevent layout thrashing during window resize
      const debouncedInit = debounce(() => {
        init();
      }, 200);

      resizeObserver = new ResizeObserver(() => {
        debouncedInit();
      });

      resizeObserver.observe(wrapper);
    }

    parentElement.addEventListener("mouseenter", handleMouseEnter);
    parentElement.addEventListener("mouseleave", handleMouseLeave);

    if (!noFocus) {
      parentElement.addEventListener("focusin", handleFocusIn);
      parentElement.addEventListener("focusout", handleFocusOut);
    }

    return () => {
      clearAnimation();
      context.setTransform(1, 0, 0, 1, 0, 0);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      parentElement.removeEventListener("mouseenter", handleMouseEnter);
      parentElement.removeEventListener("mouseleave", handleMouseLeave);

      if (!noFocus) {
        parentElement.removeEventListener("focusin", handleFocusIn);
        parentElement.removeEventListener("focusout", handleFocusOut);
      }
    };
  }, [colorPalette, gap, speed, noFocus]);

  return (
    <div
      className={`pixel-canvas ${className}`.trim()}
      ref={wrapperRef}
      style={style}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default PixelCanvas;
