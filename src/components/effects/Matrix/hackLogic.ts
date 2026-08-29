import { DEFAULT_CONSOLE_PROMPT } from "./hackCopy";
import {
  KEY_VARIETY_WINDOW,
  MAX_DISPLAY_LENGTH,
  REPETITION_DECAY_RESET_MS,
} from "./hackTuning";

export interface KeyPattern {
  recentKeys: string[];
  lastKey: string | null;
  streak: number;
}

export interface InteractionResult {
  feedbackMessage: string;
  progressDelta: number;
  chunkSize: number;
  direction: "forward" | "backward";
}

export function updateHackStreamBuffer(
  prev: string,
  hackStreamIndex: number,
  hackCorpus: string,
  direction: "forward" | "backward",
  magnitude: number
): { newBuffer: string; newIndex: number } {
  if (direction === "backward") {
    const nextLength = Math.max(0, prev.length - magnitude);
    const trimmed =
      nextLength <= DEFAULT_CONSOLE_PROMPT.length
        ? DEFAULT_CONSOLE_PROMPT
        : prev.slice(0, nextLength);

    const nextIndex = (hackStreamIndex - magnitude) % hackCorpus.length;
    const newIndex = nextIndex < 0 ? hackCorpus.length + nextIndex : nextIndex;

    return { newBuffer: trimmed, newIndex };
  }

  let remaining = magnitude;
  let chunk = "";
  let currentIndex = hackStreamIndex;

  while (remaining > 0) {
    const available = Math.min(remaining, hackCorpus.length - currentIndex);

    if (available <= 0) {
      break;
    }

    chunk += hackCorpus.slice(currentIndex, currentIndex + available);
    currentIndex = (currentIndex + available) % hackCorpus.length;
    remaining -= available;
  }

  if (chunk.length === 0) {
    return { newBuffer: prev, newIndex: currentIndex };
  }

  const combined = `${prev}${chunk}`;
  const newBuffer =
    combined.length <= MAX_DISPLAY_LENGTH
      ? combined
      : combined.slice(combined.length - MAX_DISPLAY_LENGTH);

  return { newBuffer, newIndex: currentIndex };
}

export function calculateInteractionResult(
  isBackspace: boolean,
  key: string,
  delta: number | null,
  tracker: KeyPattern
): InteractionResult {
  let baseIncrement = 0.6;

  if (delta !== null) {
    if (delta < 120) {
      baseIncrement = 1.8;
    } else if (delta < 220) {
      baseIncrement = 1.3;
    } else if (delta < 360) {
      baseIncrement = 0.95;
    } else {
      baseIncrement = 0.45;
    }
  }

  let feedbackMessage = "Signal detected. Keep the keystrokes flowing.";
  let progressDelta = 0;
  let chunkSize = 0;
  let direction: "forward" | "backward" = "forward";

  if (isBackspace) {
    direction = "backward";
    chunkSize = Math.max(4, Math.round(baseIncrement * 3.5));

    tracker.lastKey = null;
    tracker.streak = 0;

    feedbackMessage = "Trace sanitized. Countermeasure resetting.";
    progressDelta = -Math.max(0.45, baseIncrement * 0.65);
  } else {
    const normalizedKey = key === " " ? "space" : key.toLowerCase();

    if (
      tracker.lastKey === normalizedKey &&
      (delta === null || delta <= REPETITION_DECAY_RESET_MS)
    ) {
      tracker.streak += 1;
    } else {
      tracker.streak = 1;
    }

    tracker.lastKey = normalizedKey;
    tracker.recentKeys = [
      ...tracker.recentKeys.slice(-(KEY_VARIETY_WINDOW - 1)),
      normalizedKey,
    ];

    const uniqueCount = new Set(tracker.recentKeys).size;
    let comboMultiplier = 1;

    if (uniqueCount >= 7) comboMultiplier += 0.25;
    else if (uniqueCount >= 5) comboMultiplier += 0.15;

    if (normalizedKey === "touch") {
      comboMultiplier = 1.2;
    } else {
      if (tracker.streak >= 4) comboMultiplier *= 0.25;
      if (uniqueCount <= 3 && tracker.recentKeys.length >= KEY_VARIETY_WINDOW) {
        comboMultiplier *= 0.4;
      }
    }

    if (delta !== null) {
      if (delta < 140) feedbackMessage = "Trace evaded! Ultra-fast hack underway.";
      else if (delta < 260) feedbackMessage = "Firewall destabilizing—stellar rhythm.";
      else if (delta < 400) feedbackMessage = "Maintaining uplink. Accelerate to finish.";
      else feedbackMessage = "Connection cooling—slam the keys faster!";
    }

    const comboAdjustedIncrement = baseIncrement * comboMultiplier;
    const chunkBase = Math.max(8, Math.round(comboAdjustedIncrement * 4));
    const chunkVariance = Math.floor(Math.random() * 5);

    chunkSize = chunkBase + chunkVariance;
    direction = "forward";
    progressDelta = comboAdjustedIncrement;
  }

  return {
    feedbackMessage,
    progressDelta,
    chunkSize,
    direction,
  };
}

export function calculateNextHackProgress(prev: number, progressDelta: number): number {
  if (progressDelta > 0) {
    const friction =
      prev >= 85 ? 0.35 : prev >= 65 ? 0.5 : prev >= 40 ? 0.65 : 0.8;
    const next = prev + progressDelta * friction;
    return Math.min(100, next);
  } else if (progressDelta < 0) {
    return Math.max(0, prev + progressDelta);
  }
  return prev;
}
