import { useEffect, type RefObject } from "react";
import { debounce } from "../../../utils/commonUtils";
import { MATRIX_RAIN } from "./constants";
import { Drop } from "./MatrixDrop";

interface UseMatrixRainProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isVisible: boolean;
}

export const useMatrixRain = ({ canvasRef, isVisible }: UseMatrixRainProps) => {
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resizeCanvas = () => {
      if (!canvas || !context) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // * Vignette handled by CSS overlay for performance
    };

    const handleResize = debounce(resizeCanvas, 200);

    resizeCanvas();
    window.addEventListener("resize", handleResize);

    const columns = Math.floor(canvas.width / MATRIX_RAIN.FONT_SIZES.MIN);
    const drops = Array(columns)
      .fill(null)
      .map((_, i) => {
        const drop = new Drop(i * MATRIX_RAIN.FONT_SIZES.MIN);
        drop.y = (Math.random() * canvas.height) / MATRIX_RAIN.FONT_SIZES.MIN;
        return drop;
      });

    // * Performance Optimization: Pre-allocate buckets to prevent per-frame garbage collection
    // * We reuse these arrays every frame instead of creating new ones
    const buckets: Record<number, Drop[]> = {};
    for (
      let size = MATRIX_RAIN.FONT_SIZES.MIN;
      size <= MATRIX_RAIN.FONT_SIZES.MAX;
      size++
    ) {
      buckets[size] = [];
    }

    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const drawFrame = (currentTime: number) => {
      if (!canvas || !context) return;
      if (currentTime - lastTime >= frameInterval) {
        // * Enhanced fade effect with slight green tint
        context.fillStyle = "rgba(0, 0, 0, 0.04)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // * Update all drops first
        for (const drop of drops) {
          drop.update(canvas.height);
        }

        // * Performance Optimization: Batch drawing by font size to minimize state changes
        // * Reset buckets without reallocation
        for (const key in buckets) {
          buckets[key].length = 0;
        }

        // Group drops by font size
        for (const drop of drops) {
          // Safety check in case random logic produces unexpected size
          if (!buckets[drop.fontSize]) {
            buckets[drop.fontSize] = [];
          }
          buckets[drop.fontSize].push(drop);
        }

        // Iterate through buckets
        for (const fontSizeStr in buckets) {
          const bucket = buckets[fontSizeStr];
          if (bucket.length === 0) continue;
          // Set font once per bucket
          context.font = `${fontSizeStr}px monospace`;

          // * Pass 1: Draw Trails (Pure Green)
          context.fillStyle = "#00FF00";
          for (const drop of bucket) {
            const trailLength = drop.trail.length;
            for (let i = 0; i < trailLength; i++) {
              const trailItem = drop.trail[i];
              const trailOpacity = (i / trailLength) * drop.opacity * 0.3;
              context.globalAlpha = trailOpacity;
              context.fillText(
                trailItem.char,
                drop.x,
                trailItem.y * drop.fontSize,
              );
            }
          }

          // * Pass 2: Draw Normal Heads (Spring Green)
          context.fillStyle = "#00FF64";
          for (const drop of bucket) {
            if (!drop.brightness) {
              context.globalAlpha = drop.opacity;
              context.fillText(drop.char, drop.x, drop.y * drop.fontSize);
            }
          }

          // * Pass 3: Draw Bright Heads (White + Glow)
          context.fillStyle = "#FFFFFF";
          context.shadowColor = "rgba(255, 255, 255, 0.9)";
          context.shadowBlur = 8;

          for (const drop of bucket) {
            if (drop.brightness) {
              context.globalAlpha = Math.min(1, drop.opacity * 1.5);
              context.fillText(drop.char, drop.x, drop.y * drop.fontSize);
            }
          }

          // Reset shadow for next bucket/pass
          context.shadowBlur = 0;
        }

        // Reset alpha at end of frame
        context.globalAlpha = 1.0;

        lastTime = currentTime;
      }
    };

    let animationFrameId = 0;
    const animate = (currentTime: number) => {
      drawFrame(currentTime);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, canvasRef]);
};
