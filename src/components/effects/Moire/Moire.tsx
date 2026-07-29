// @ts-nocheck - Legacy OGL implementation with complex types
import * as ogl from "ogl";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { debounce, throttle } from "../../../utils/commonUtils";
import RippleEffect from "./RippleEffect";
import "./Moire.css";

interface MagicComponentProps {
  isVisible?: boolean;
  opacity?: number;
}

function MagicComponent({
  isVisible = true,
  opacity = 0.2,
}: MagicComponentProps) {
  const containerRef = useRef(null);
  const visibilityStyle = {
    opacity: isVisible ? opacity : 0,
  } satisfies CSSProperties;

  useEffect(() => {
    // We capture the cleanup logic from the async initialization
    let internalCleanup: (() => void) | null = null;
    let animationFrameId: number | null = null;

    // Small delay to ensure DOM is fully ready (fixes React 18 concurrent rendering timing)
    const timeoutId = setTimeout(() => {
      const { Renderer, Camera, Geometry, Program, Mesh, Color, Vec2 } = ogl;
      const state = {};
      const containerEl = containerRef.current;
      // If the component has already unmounted, containerEl will be null
      if (!containerEl) return;

      state.renderer = new Renderer({ dpr: 1 });
      state.gl = state.renderer.gl;
      containerEl.appendChild(state.gl.canvas as HTMLCanvasElement);

      state.camera = new Camera(state.gl, { fov: 45 });
      state.camera.position.set(0, 0, 50);

      state.mouse = new Vec2();
      state.mouseOver = false;
      state.hasNewMouseInput = false;

      state.color1 = new Color([0.149, 0.141, 0.912]);
      state.color2 = new Color([1.0, 0.833, 0.224]);
      state.cameraZ = 50;

      const resize = () => {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.renderer.setSize(state.width, state.height);
        state.camera.perspective({ aspect: state.width / state.height });

        const vFOV = (state.camera.fov * Math.PI) / 180;
        const height =
          2 * Math.tan(vFOV / 2) * Math.abs(state.camera.position.z);
        const width = height * state.camera.aspect;
        state.wWidth = width;

        if (state.points) initPointsMesh();
      };

      const initScene = () => {
        state.gl.clearColor(1, 1, 1, 1);
        state.ripple = new RippleEffect(state.renderer);
        initPointsMesh();
      };

      const initPointsMesh = () => {
        const ssize = 3; // screen space
        const wsize = (ssize * state.wWidth) / state.width;
        const nx = Math.floor(state.width / ssize) + 1;
        const ny = Math.floor(state.height / ssize) + 1;
        const numPoints = nx * ny;
        const ox = -wsize * (nx / 2 - 0.5);
        const oy = -wsize * (ny / 2 - 0.5);
        const positions = new Float32Array(numPoints * 3);
        const uvs = new Float32Array(numPoints * 2);
        const sizes = new Float32Array(numPoints);

        state.gridRatio = state.width / state.height;
        let uvx: number;
        let uvy: number;
        let uvdx: number;
        let uvdy: number;
        if (state.gridRatio >= 1) {
          uvx = 0;
          uvdx = 1 / nx;
          uvy = (1 - 1 / state.gridRatio) / 2;
          uvdy = 1 / ny / state.gridRatio;
        } else {
          uvx = (1 - 1 * state.gridRatio) / 2;
          uvdx = (1 / nx) * state.gridRatio;
          uvy = 0;
          uvdy = 1 / ny;
        }

        for (let i = 0; i < nx; i++) {
          const x = ox + i * wsize;
          for (let j = 0; j < ny; j++) {
            const i1 = i * ny + j;
            positions.set([x, oy + j * wsize, 0], i1 * 3);
            uvs.set([uvx + i * uvdx, uvy + j * uvdy], i1 * 2);
            sizes[i1] = ssize / 2;
          }
        }

        const geometry = new Geometry(state.gl, {
          position: { size: 3, data: positions },
          uv: { size: 2, data: uvs },
          size: { size: 1, data: sizes },
        });

        if (state.points) {
          state.points.geometry = geometry;
        } else {
          const program = new Program(state.gl, {
            uniforms: {
              hmap: { value: state.ripple.gpgpu.read.texture },
              color1: { value: state.color1 },
              color2: { value: state.color2 },
            },
            vertex: `
            precision highp float;
            const float PI = 3.1415926535897932384626433832795;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform sampler2D hmap;
            uniform vec3 color1;
            uniform vec3 color2;
            attribute vec2 uv;
            attribute vec3 position;
            attribute float size;
            varying vec4 vColor;
            void main() {
                vec3 pos = position.xyz;
                vec4 htex = texture2D(hmap, uv);
                pos.z = 10. * htex.r;

                vec3 mixPct = vec3(0.0);
                mixPct.r = smoothstep(0.0, 0.5, htex.r);
                mixPct.g = sin(htex.r * PI);
                mixPct.b = pow(htex.r, 0.5);
                vColor = vec4(mix(color1, color2, mixPct), 1.0);

                gl_PointSize = size;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
            fragment: `
            precision highp float;
            varying vec4 vColor;
            void main() {
              gl_FragColor = vColor;
            }
          `,
          });
          state.points = new Mesh(state.gl, {
            geometry,
            program,
            mode: state.gl.POINTS,
          });
        }
      };

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        state.camera.position.z +=
          (state.cameraZ - state.camera.position.z) * 0.02;

        // Optimization: Only render drops on frame update, not on every mouse event
        if (state.hasNewMouseInput) {
          state.ripple.addDrop(state.mouse.x, state.mouse.y, 0.05, 0.05);
          state.hasNewMouseInput = false;
        } else if (!state.mouseOver) {
          const time = Date.now() * 0.001;
          const x = Math.cos(time) * 0.2;
          const y = Math.sin(time) * 0.2;
          state.ripple.addDrop(x, y, 0.05, 0.05);
        }

        state.ripple.update();
        state.renderer.render({ scene: state.points, camera: state.camera });
      };

      resize();
      initScene();
      animate();

      const getScrollPercentage = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const { scrollHeight, clientHeight } = document.documentElement;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll <= 0) return 0;
        return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      };

      const handleScroll = throttle(() => {
        state.cameraZ = 50 - getScrollPercentage() * 3;
      }, 16);

      // Event listeners are set up here, and will be cleaned up in the return function
      const debouncedResize = debounce(resize, 200);
      window.addEventListener("resize", debouncedResize, false);
      document.addEventListener("scroll", handleScroll, { passive: true });

      const onMove = (e) => {
        state.mouseOver = true;
        const touchX = e.changedTouches?.[0]?.pageX;
        const touchY = e.changedTouches?.[0]?.pageY;
        const pageX = e.x === undefined ? e.pageX : e.x;
        const pageY = e.y === undefined ? e.pageY : e.y;

        const x = touchX || pageX;
        const y = touchY || pageY;

        state.mouse.set(
          (x / state.gl.renderer.width) * 2 - 1,
          (1.0 - y / state.gl.renderer.height) * 2 - 1,
        );

        if (state.gridRatio >= 1) {
          state.mouse.y /= state.gridRatio;
        } else {
          state.mouse.x /= state.gridRatio;
        }

        // Optimization: Flag for next frame instead of rendering immediately
        state.hasNewMouseInput = true;
      };

      const handleMouseLeave = () => {
        state.mouseOver = false;
      };

      if ("ontouchstart" in window) {
        document.body.addEventListener("touchstart", onMove, false);
        document.body.addEventListener("touchmove", onMove, false);
        document.body.addEventListener("touchend", handleMouseLeave, false);
      } else {
        document.body.addEventListener("mousemove", onMove, false);
        document.body.addEventListener("mouseleave", handleMouseLeave, false);
      }

      // Assign the cleanup function to the variable scoped to useEffect
      internalCleanup = () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        window.removeEventListener("resize", debouncedResize, false);
        document.removeEventListener("scroll", handleScroll, { passive: true });
        if ("ontouchstart" in window) {
          document.body.removeEventListener("touchstart", onMove, false);
          document.body.removeEventListener("touchmove", onMove, false);
          document.body.removeEventListener(
            "touchend",
            handleMouseLeave,
            false,
          );
        } else {
          document.body.removeEventListener("mousemove", onMove, false);
          document.body.removeEventListener(
            "mouseleave",
            handleMouseLeave,
            false,
          );
        }

        if (state.gl?.canvas?.parentNode) {
          state.gl.canvas.parentNode.removeChild(state.gl.canvas);
        }
      };
    }, 0);

    // Main Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (internalCleanup) internalCleanup();
    };
  }, []);

  return <div id="magicContainer" ref={containerRef} style={visibilityStyle} />;
}

export default MagicComponent;
