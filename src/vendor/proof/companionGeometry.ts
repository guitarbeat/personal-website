import { proofAtlas } from "./atlas.js";
import type { ProofPlacement, ProofPoint } from "./types.js";

export const DEFAULT_COMPANION_SIZE = 208;
const EDGE_PIN_TOLERANCE = 2;

export interface ViewportBounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface ViewportGeometry {
  bounds: ViewportBounds;
  size: number;
}

export function normalizeCompanionSize(size: number): number {
  return Number.isFinite(size) && size > 0
    ? size
    : DEFAULT_COMPANION_SIZE;
}

export function companionWidth(size: number): number {
  return size * (proofAtlas.cellWidth / proofAtlas.cellHeight);
}

export function viewportBounds(
  size: number,
  inset: number,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): ViewportBounds {
  const width = companionWidth(size);
  const availableX = Math.max(0, viewportWidth - width);
  const availableY = Math.max(0, viewportHeight - size);
  const horizontalInset = Math.min(Math.max(0, inset), availableX / 2);
  const verticalInset = Math.min(Math.max(0, inset), availableY / 2);
  return {
    minX: horizontalInset,
    maxX: availableX - horizontalInset,
    minY: verticalInset,
    maxY: availableY - verticalInset,
  };
}

export function currentViewportGeometry(
  size: number,
  inset: number,
): ViewportGeometry {
  return {
    bounds: viewportBounds(
      size,
      inset,
      window.innerWidth,
      window.innerHeight,
    ),
    size,
  };
}

export function samePoint(first: ProofPoint, second: ProofPoint): boolean {
  return first.x === second.x && first.y === second.y;
}

function repositionAxis(
  coordinate: number,
  oldMin: number,
  oldMax: number,
  oldExtent: number,
  newMin: number,
  newMax: number,
  newExtent: number,
): number {
  if (Math.abs(coordinate - oldMin) <= EDGE_PIN_TOLERANCE) {
    return newMin;
  }
  if (Math.abs(coordinate - oldMax) <= EDGE_PIN_TOLERANCE) {
    return newMax;
  }
  return coordinate + (oldExtent - newExtent) / 2;
}

export function repositionForGeometry(
  point: ProofPoint,
  previous: ViewportGeometry,
  next: ViewportGeometry,
): ProofPoint {
  const oldWidth = companionWidth(previous.size);
  const newWidth = companionWidth(next.size);
  return {
    x: Math.min(
      Math.max(
        repositionAxis(
          point.x,
          previous.bounds.minX,
          previous.bounds.maxX,
          oldWidth,
          next.bounds.minX,
          next.bounds.maxX,
          newWidth,
        ),
        next.bounds.minX,
      ),
      next.bounds.maxX,
    ),
    y: Math.min(
      Math.max(
        repositionAxis(
          point.y,
          previous.bounds.minY,
          previous.bounds.maxY,
          previous.size,
          next.bounds.minY,
          next.bounds.maxY,
          next.size,
        ),
        next.bounds.minY,
      ),
      next.bounds.maxY,
    ),
  };
}

export function viewportPosition(
  placement: ProofPlacement,
  size: number,
  inset: number,
): ProofPoint {
  const bounds = viewportBounds(size, inset);
  return {
    x: placement.endsWith("right") ? bounds.maxX : bounds.minX,
    y: placement.startsWith("bottom") ? bounds.maxY : bounds.minY,
  };
}

export function clampToViewport(
  point: ProofPoint,
  size: number,
  inset: number,
): ProofPoint {
  const bounds = viewportBounds(size, inset);
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  };
}
