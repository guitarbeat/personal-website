import * as ogl from "ogl";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { debounce, throttle } from "../../../utils/commonUtils";
import RippleEffect from "./RippleEffect";
import "./Moire.css";


// biome-ignore lint/suspicious/noExplicitAny: Complex OGL types lack exact definitions
type AnyOGL = any;

interface MoireState {
  renderer?: AnyOGL;
  gl?: ogl.OGLRenderingContext;
  camera?: AnyOGL;
  mouse?: AnyOGL;
  mouseOver?: boolean;
  hasNewMouseInput?: boolean;
  color1?: AnyOGL;
  color2?: AnyOGL;
  cameraZ?: number;
  width?: number;
  height?: number;
  wWidth?: number;
  points?: AnyOGL;
  ripple?: AnyOGL;
  gridRatio?: number;
}


interface MagicComponentProps {
  isVisible?: boolean;
  opacity?: number;
}

const resize = (state: MoireState) => {
  if (!state.renderer || !state.camera || !state.gl) return;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.renderer.setSize(state.width, state.height);
  state.camera.perspective({ aspect: state.width / state.height });

  const vFOV = (state.camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * Math.abs(state.camera.position.z);
  const width = height * state.camera.aspect;
  state.wWidth = width;

  if (state.points) initPointsMesh(state);
};

const initPointsMesh = (state: MoireState) => {
  if (!state.gl || !state.wWidth || !state.width || !state.height || !state.ripple) return;
  const { Geometry, Program, Mesh } = ogl;

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
    // biome-ignore lint/suspicious/noExplicitAny: Required for OGL Mesh
    const mode = (state.gl as any).POINTS;
    state.points = new Mesh(state.gl, {
      geometry,
      program,
      mode: mode,
    });
  }
};

const initScene = (state: MoireState) => {
  if (!state.gl || !state.renderer) return;
  // biome-ignore lint/suspicious/noExplicitAny: Standard WebGL method
  (state.gl as any).clearColor(1, 1, 1, 1);
  state.ripple = new RippleEffect(state.renderer);
  initPointsMesh(state);
};

const setupEventListeners = (state: MoireState) => {
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

  const debouncedResize = debounce(() => resize(state), 200);
  window.addEventListener("resize", debouncedResize, false);
  document.addEventListener("scroll", handleScroll, { passive: true });

  // biome-ignore lint/suspicious/noExplicitAny: DOM event types
  const onMove = (e: any) => {
    if (!state.mouse || !state.gl) return;
    state.mouseOver = true;
    const touchX = e.changedTouches?.[0]?.pageX;
    const touchY = e.changedTouches?.[0]?.pageY;
    const pageX = e.x === undefined ? e.pageX : e.x;
    const pageY = e.y === undefined ? e.pageY : e.y;

    const x = touchX || pageX;
    const y = touchY || pageY;

    // biome-ignore lint/suspicious/noExplicitAny: OGL renderer properties
    const rendererWidth = (state.gl as any).renderer.width;
    // biome-ignore lint/suspicious/noExplicitAny: OGL renderer properties
    const rendererHeight = (state.gl as any).renderer.height;

    state.mouse.set(
      (x / rendererWidth) * 2 - 1,
      (1.0 - y / rendererHeight) * 2 - 1,
    );

    if (state.gridRatio !== undefined && state.gridRatio >= 1) {
      state.mouse.y /= state.gridRatio;
    } else if (state.gridRatio !== undefined) {
      state.mouse.x /= state.gridRatio;
    }

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

  return () => {
    window.removeEventListener("resize", debouncedResize, false);
    document.removeEventListener("scroll", handleScroll, {
      passive: true,
    } as EventListenerOptions);
    if ("ontouchstart" in window) {
      document.body.removeEventListener("touchstart", onMove, false);
      document.body.removeEventListener("touchmove", onMove, false);
      document.body.removeEventListener("touchend", handleMouseLeave, false);
    } else {
      document.body.removeEventListener("mousemove", onMove, false);
      document.body.removeEventListener("mouseleave", handleMouseLeave, false);
    }
  };
};

function MagicComponent({
  isVisible = true,
  opacity = 0.2,
}: MagicComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityStyle = {
    opacity: isVisible ? opacity : 0,
  } satisfies CSSProperties;

  useEffect(() => {
    let internalCleanup: (() => void) | null = null;
    let animationFrameId: number | null = null;
    const state: MoireState = {};

    const timeoutId = setTimeout(() => {
      const { Renderer, Camera, Color, Vec2 } = ogl;
      const containerEl = containerRef.current;
      if (!containerEl) return;

      state.renderer = new Renderer({ dpr: 1 });
      // biome-ignore lint/suspicious/noExplicitAny: OGL property access
      state.gl = (state.renderer as any).gl;
      if (state.gl) {
        // biome-ignore lint/suspicious/noExplicitAny: canvas is a standard property
        containerEl.appendChild((state.gl as any).canvas as HTMLCanvasElement);
      }

      if (state.gl) {
        state.camera = new Camera(state.gl, { fov: 45 });
        if (state.camera) {
          state.camera.position.set(0, 0, 50);
        }
      }

      state.mouse = new Vec2();
      state.mouseOver = false;
      state.hasNewMouseInput = false;

      state.color1 = new Color([0.149, 0.141, 0.912]);
      state.color2 = new Color([1.0, 0.833, 0.224]);
      state.cameraZ = 50;

      resize(state);
      initScene(state);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (state.camera && state.cameraZ !== undefined) {
          state.camera.position.z +=
            (state.cameraZ - state.camera.position.z) * 0.02;
        }

        if (state.ripple) {
          if (state.hasNewMouseInput && state.mouse) {
            state.ripple.addDrop(state.mouse.x, state.mouse.y, 0.05, 0.05);
            state.hasNewMouseInput = false;
          } else if (!state.mouseOver) {
            const time = Date.now() * 0.001;
            const x = Math.cos(time) * 0.2;
            const y = Math.sin(time) * 0.2;
            state.ripple.addDrop(x, y, 0.05, 0.05);
          }

          state.ripple.update();
        }
        if (state.renderer && state.points && state.camera) {
          state.renderer.render({ scene: state.points, camera: state.camera });
        }
      };

      animate();
      const eventsCleanup = setupEventListeners(state);

      internalCleanup = () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        eventsCleanup();
        // biome-ignore lint/suspicious/noExplicitAny: canvas node navigation
        if ((state.gl as any)?.canvas?.parentNode) {
          // biome-ignore lint/suspicious/noExplicitAny: canvas node navigation
          (state.gl as any).canvas.parentNode.removeChild((state.gl as any).canvas);
        }
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (internalCleanup) internalCleanup();
    };
  }, []);

  return <div id="magicContainer" ref={containerRef} style={visibilityStyle} />;
}

export default MagicComponent;
