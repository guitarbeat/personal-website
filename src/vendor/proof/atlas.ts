import type { ProofFrame, ProofState } from "./types.js";

export const proofAtlas = {
  id: "proof",
  imageWidth: 1536,
  imageHeight: 2288,
  columns: 8,
  rows: 11,
  cellWidth: 192,
  cellHeight: 208,
  neutral: { row: 0, column: 0 },
} as const;

export interface ProofAnimation {
  row: number;
  columns: readonly number[];
  durations: readonly number[];
  loop: boolean;
}

const eight = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const six = [0, 1, 2, 3, 4, 5] as const;

export const proofAnimations: Record<ProofState, ProofAnimation> = {
  idle: {
    row: 0,
    columns: six,
    durations: [280, 110, 110, 140, 140, 320],
    loop: true,
  },
  "move-right": {
    row: 1,
    columns: eight,
    durations: eight.map(() => 120),
    loop: true,
  },
  "move-left": {
    row: 2,
    columns: eight,
    durations: eight.map(() => 120),
    loop: true,
  },
  wave: {
    row: 3,
    columns: [0, 1, 2, 3],
    durations: [260, 180, 320, 180],
    loop: false,
  },
  hover: {
    row: 4,
    columns: [0, 1, 2, 3, 4],
    durations: [180, 140, 140, 140, 240],
    loop: false,
  },
  standing: {
    row: 4,
    columns: [4],
    durations: [1000],
    loop: true,
  },
  lowering: {
    row: 4,
    columns: [4, 3, 2, 1, 0],
    durations: [180, 140, 140, 140, 240],
    loop: false,
  },
  error: {
    row: 5,
    columns: eight,
    durations: [140, 140, 140, 140, 140, 140, 140, 240],
    loop: false,
  },
  waiting: {
    row: 6,
    columns: six,
    durations: [180, 150, 220, 300, 150, 280],
    loop: true,
  },
  working: {
    row: 7,
    columns: six,
    durations: [120, 120, 120, 120, 180, 240],
    loop: true,
  },
  review: {
    row: 8,
    columns: six,
    durations: six.map(() => 180),
    loop: true,
  },
};

export function animationFrame(
  state: ProofState,
  frameIndex: number,
): ProofFrame {
  const animation = proofAnimations[state];
  const safeIndex = Math.min(
    Math.max(0, frameIndex),
    animation.columns.length - 1,
  );
  return {
    row: animation.row,
    column: animation.columns[safeIndex] ?? animation.columns[0] ?? 0,
  };
}

export function frameBackgroundPosition(frame: ProofFrame): string {
  const x = (frame.column / (proofAtlas.columns - 1)) * 100;
  const y = (frame.row / (proofAtlas.rows - 1)) * 100;
  return `${x}% ${y}%`;
}
