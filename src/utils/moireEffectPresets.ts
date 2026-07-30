import { clamp } from "./commonUtils";

export interface MoireEffectPreset {
  colors: string[];
  gap: number;
  speed: number;
  noFocus?: boolean;
}

export const DEFAULT_PROJECT_EFFECT: MoireEffectPreset = {
  colors: ["#f8fafc", "#cbd5f5", "#94a3b8"],
  gap: 9,
  speed: 24,
};

export const WORK_CARD_EFFECTS: MoireEffectPreset[] = [
  {
    colors: ["#f8fafc", "#f1f5f9", "#cbd5e1"],
    gap: 8,
    speed: 24,
  },
  {
    colors: ["#e0f2fe", "#7dd3fc", "#0ea5e9"],
    gap: 12,
    speed: 18,
  },
  {
    colors: ["#fef08a", "#fde047", "#eab308"],
    gap: 10,
    speed: 16,
  },
  {
    colors: ["#fecdd3", "#fda4af", "#e11d48"],
    gap: 11,
    speed: 28,
    noFocus: true,
  },
];

const parseHsl = (color: string | undefined) => {
  if (typeof color !== "string") {
    return null;
  }

  const match = color
    .replace(/\s+/g, "")
    .match(/^hsl\(([-\d.]+),([-\d.]+)%,([-\d.]+)%\)$/i);

  if (!match) {
    return null;
  }

  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  };
};

const createPaletteFromHsl = (color: string | undefined): string[] => {
  const parsed = parseHsl(color);

  if (!parsed) {
    return DEFAULT_PROJECT_EFFECT.colors;
  }

  const { h, s, l } = parsed;
  const accent = `hsl(${h}, ${clamp(s + 12, 0, 100)}%, ${clamp(l + 18, 0, 96)}%)`;
  const base = `hsl(${h}, ${clamp(s + 6, 0, 100)}%, ${clamp(l + 6, 0, 96)}%)`;
  const shadow = `hsl(${h}, ${clamp(s + 4, 0, 100)}%, ${clamp(l - 10, 4, 92)}%)`;

  return [accent, base, shadow];
};

export function createProjectEffect(
  tagColor: string | undefined,
  index: number,
): MoireEffectPreset {
  return {
    colors: createPaletteFromHsl(tagColor),
    gap: 8 + (index % 3) * 2,
    speed: 18 + (index % 4) * 3,
  };
}
