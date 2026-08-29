import { DEFAULT_CONSOLE_PROMPT } from "../hackCopy";
import {
  calculateInteractionResult,
  calculateNextHackProgress,
  type KeyPattern,
  updateHackStreamBuffer,
} from "../hackLogic";
import { MAX_DISPLAY_LENGTH } from "../hackTuning";

describe("hackLogic", () => {
  describe("updateHackStreamBuffer", () => {
    const mockCorpus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    it("should handle forward chunk appending", () => {
      const { newBuffer, newIndex } = updateHackStreamBuffer(
        "prev-",
        0,
        mockCorpus,
        "forward",
        5,
      );
      expect(newBuffer).toBe("prev-ABCDE");
      expect(newIndex).toBe(5);
    });

    it("should handle forward chunk appending with wraparound", () => {
      const { newBuffer, newIndex } = updateHackStreamBuffer(
        "",
        24, // YZ...
        mockCorpus,
        "forward",
        5, // ...ABC
      );
      expect(newBuffer).toBe("YZABC");
      expect(newIndex).toBe(3); // after ABC
    });

    it("should enforce MAX_DISPLAY_LENGTH on forward appends", () => {
      const longPrev = "A".repeat(MAX_DISPLAY_LENGTH - 2);
      const { newBuffer } = updateHackStreamBuffer(
        longPrev,
        0,
        mockCorpus,
        "forward",
        5,
      );
      expect(newBuffer.length).toBe(MAX_DISPLAY_LENGTH);
      // It should have sliced off the beginning of longPrev
      expect(newBuffer.endsWith("ABCDE")).toBe(true);
    });

    it("should handle backward deletion limits", () => {
      const prev = DEFAULT_CONSOLE_PROMPT + "ABC";
      const { newBuffer, newIndex } = updateHackStreamBuffer(
        prev,
        3,
        mockCorpus,
        "backward",
        5, // Trying to delete more than what was added
      );
      expect(newBuffer).toBe(DEFAULT_CONSOLE_PROMPT);
      expect(newIndex).toBe(mockCorpus.length - 2); // 3 - 5 = -2 -> 24
    });
  });

  describe("calculateInteractionResult", () => {
    let mockTracker: KeyPattern;

    beforeEach(() => {
      mockTracker = {
        recentKeys: [],
        lastKey: null,
        streak: 0,
      };
    });

    it("should handle backspace reset", () => {
      mockTracker.lastKey = "a";
      mockTracker.streak = 5;

      const result = calculateInteractionResult(
        true,
        "Backspace",
        100,
        mockTracker,
      );

      expect(result.direction).toBe("backward");
      expect(result.progressDelta).toBeLessThan(0);
      expect(mockTracker.lastKey).toBeNull();
      expect(mockTracker.streak).toBe(0);
      expect(result.feedbackMessage).toContain("Trace sanitized");
    });

    it("should handle fast keystroke deltas", () => {
      const result = calculateInteractionResult(false, "a", 50, mockTracker);
      expect(result.direction).toBe("forward");
      expect(result.progressDelta).toBeGreaterThan(0);
      expect(result.feedbackMessage).toContain("Ultra-fast");
    });

    it("should handle slow keystroke deltas", () => {
      const result = calculateInteractionResult(false, "a", 500, mockTracker);
      expect(result.direction).toBe("forward");
      expect(result.progressDelta).toBeGreaterThan(0);
      expect(result.feedbackMessage).toContain("Connection cooling");
    });

    it("should handle combo multipliers for varied keys", () => {
      // simulate lots of unique recent keys
      mockTracker.recentKeys = ["a", "b", "c", "d", "e", "f", "g"];

      // baseline
      const slowDeltaResult = calculateInteractionResult(false, "a", 500, {
        recentKeys: ["a", "a", "a"],
        lastKey: "a",
        streak: 0,
      });

      // with multiplier
      const result = calculateInteractionResult(false, "h", 500, mockTracker);

      expect(result.progressDelta).toBeGreaterThan(
        slowDeltaResult.progressDelta,
      );
    });

    it("should handle touch key behavior", () => {
      const result = calculateInteractionResult(
        false,
        "touch",
        100,
        mockTracker,
      );
      // touch key has a fixed 1.2 combo multiplier
      expect(result.progressDelta).toBeGreaterThan(0);
    });
  });

  describe("calculateNextHackProgress", () => {
    it("should apply correct friction below 40", () => {
      const result = calculateNextHackProgress(20, 10);
      expect(result).toBe(20 + 10 * 0.8);
    });

    it("should apply correct friction above 40", () => {
      const result = calculateNextHackProgress(50, 10);
      expect(result).toBe(50 + 10 * 0.65);
    });

    it("should apply correct friction above 65", () => {
      const result = calculateNextHackProgress(70, 10);
      expect(result).toBe(70 + 10 * 0.5);
    });

    it("should apply correct friction above 85", () => {
      const result = calculateNextHackProgress(90, 10);
      expect(result).toBe(90 + 10 * 0.35);
    });

    it("should clamp maximum to 100", () => {
      const result = calculateNextHackProgress(98, 10);
      expect(result).toBe(100);
    });

    it("should clamp negative progress to 0", () => {
      const result = calculateNextHackProgress(5, -10);
      expect(result).toBe(0);
    });
  });
});
