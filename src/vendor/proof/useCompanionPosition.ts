"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  clampToViewport,
  currentViewportGeometry,
  repositionForGeometry,
  samePoint,
  viewportPosition,
  type ViewportGeometry,
} from "./companionGeometry.js";
import type { ProofPlacement, ProofPoint } from "./types.js";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function readStoredPosition(storageKey: string): ProofPoint | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as Partial<ProofPoint>;
    return Number.isFinite(parsed.x) && Number.isFinite(parsed.y)
      ? { x: Number(parsed.x), y: Number(parsed.y) }
      : null;
  } catch {
    return null;
  }
}

function writeStoredPosition(storageKey: string, point: ProofPoint): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(point));
  } catch {
    // Storage can be unavailable in sandboxed embeds. Positioning still works.
  }
}

export interface UseCompanionPositionOptions {
  size: number;
  position?: ProofPoint;
  defaultPosition?: ProofPoint;
  placement: ProofPlacement;
  inset: number;
  persistPosition: boolean;
  storageKey: string;
  onPositionChange?: (position: ProofPoint) => void;
}

export interface CompanionPositionApi {
  ready: boolean;
  motionReady: boolean;
  currentPosition: ProofPoint;
  resizing: boolean;
  positionTransitionSuppressed: boolean;
  commitPosition: (nextPosition: ProofPoint) => ProofPoint;
  suspendPositionTransition: () => void;
}

export function useCompanionPosition({
  size,
  position,
  defaultPosition,
  placement,
  inset,
  persistPosition,
  storageKey,
  onPositionChange,
}: UseCompanionPositionOptions): CompanionPositionApi {
  const geometryRef = useRef<ViewportGeometry | null>(null);
  const initializedRef = useRef(false);
  const transitionFrameRef = useRef<number | null>(null);
  const pendingCommitRef = useRef<ProofPoint | null>(null);
  const lastExternalPositionRef = useRef<ProofPoint | undefined>(position);
  const [ready, setReady] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [positionTransitionSuppressed, setPositionTransitionSuppressed] =
    useState(false);
  const [appliedGeometrySize, setAppliedGeometrySize] = useState(size);
  const [internalPosition, setInternalPosition] = useState<ProofPoint>(
    defaultPosition ?? { x: inset, y: inset },
  );
  const currentPosition = position ?? internalPosition;
  const currentPositionRef = useRef(currentPosition);
  currentPositionRef.current = currentPosition;

  useEffect(() => {
    if (position === undefined) {
      pendingCommitRef.current = null;
      lastExternalPositionRef.current = undefined;
      return;
    }
    if (
      lastExternalPositionRef.current === undefined ||
      !samePoint(lastExternalPositionRef.current, position)
    ) {
      lastExternalPositionRef.current = position;
      pendingCommitRef.current = null;
    }
  }, [position]);

  const suspendPositionTransition = useCallback(() => {
    setPositionTransitionSuppressed(true);
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }
    transitionFrameRef.current = window.requestAnimationFrame(() => {
      transitionFrameRef.current = null;
      setPositionTransitionSuppressed(false);
    });
  }, []);

  const commitPosition = useCallback(
    (nextPosition: ProofPoint) => {
      const clamped = clampToViewport(nextPosition, size, inset);
      const comparisonPosition =
        position === undefined
          ? currentPositionRef.current
          : (pendingCommitRef.current ?? currentPositionRef.current);
      if (samePoint(comparisonPosition, clamped)) {
        return clamped;
      }

      if (position === undefined) {
        currentPositionRef.current = clamped;
        setInternalPosition(clamped);
        if (persistPosition) {
          writeStoredPosition(storageKey, clamped);
        }
      } else {
        pendingCommitRef.current = clamped;
      }
      onPositionChange?.(clamped);
      return clamped;
    },
    [inset, onPositionChange, persistPosition, position, size, storageKey],
  );

  const reconcileToGeometry = useCallback(
    (nextGeometry: ViewportGeometry) => {
      const previousGeometry = geometryRef.current;
      geometryRef.current = nextGeometry;
      if (previousGeometry?.size !== nextGeometry.size) {
        setAppliedGeometrySize(nextGeometry.size);
      }
      if (!previousGeometry) {
        return;
      }
      const adjustedPosition = repositionForGeometry(
        currentPositionRef.current,
        previousGeometry,
        nextGeometry,
      );
      if (!samePoint(currentPositionRef.current, adjustedPosition)) {
        suspendPositionTransition();
        commitPosition(adjustedPosition);
      }
    },
    [commitPosition, suspendPositionTransition],
  );

  useIsomorphicLayoutEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    const stored = persistPosition ? readStoredPosition(storageKey) : null;
    const initial =
      position ??
      stored ??
      defaultPosition ??
      viewportPosition(placement, size, inset);
    const clamped = clampToViewport(initial, size, inset);
    if (position === undefined) {
      currentPositionRef.current = clamped;
      setInternalPosition(clamped);
    }
    geometryRef.current = currentViewportGeometry(size, inset);
    setAppliedGeometrySize(size);
    setReady(true);
  }, [
    defaultPosition,
    inset,
    persistPosition,
    placement,
    position,
    size,
    storageKey,
  ]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const requestId = window.requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => window.cancelAnimationFrame(requestId);
  }, [ready]);

  useIsomorphicLayoutEffect(() => {
    if (!ready) {
      return;
    }
    reconcileToGeometry(currentViewportGeometry(size, inset));
  }, [inset, ready, reconcileToGeometry, size]);

  useEffect(() => {
    const handleResize = () => {
      reconcileToGeometry(currentViewportGeometry(size, inset));
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [inset, reconcileToGeometry, size]);

  useEffect(
    () => () => {
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }
    },
    [],
  );

  const resizing = appliedGeometrySize !== size;

  return {
    ready,
    motionReady,
    currentPosition,
    resizing,
    positionTransitionSuppressed,
    commitPosition,
    suspendPositionTransition,
  };
}
