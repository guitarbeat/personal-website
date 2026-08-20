import {
  normalizeCompanionSize,
  DEFAULT_COMPANION_SIZE,
} from "../companionGeometry";

describe("normalizeCompanionSize", () => {
  it("returns the size when it is a finite positive number", () => {
    expect(normalizeCompanionSize(100)).toBe(100);
    expect(normalizeCompanionSize(1)).toBe(1);
    expect(normalizeCompanionSize(0.5)).toBe(0.5);
  });

  it("returns DEFAULT_COMPANION_SIZE when size is zero", () => {
    expect(normalizeCompanionSize(0)).toBe(DEFAULT_COMPANION_SIZE);
  });

  it("returns DEFAULT_COMPANION_SIZE when size is negative", () => {
    expect(normalizeCompanionSize(-10)).toBe(DEFAULT_COMPANION_SIZE);
    expect(normalizeCompanionSize(-100)).toBe(DEFAULT_COMPANION_SIZE);
  });

  it("returns DEFAULT_COMPANION_SIZE when size is Infinity", () => {
    expect(normalizeCompanionSize(Infinity)).toBe(DEFAULT_COMPANION_SIZE);
  });

  it("returns DEFAULT_COMPANION_SIZE when size is -Infinity", () => {
    expect(normalizeCompanionSize(-Infinity)).toBe(DEFAULT_COMPANION_SIZE);
  });

  it("returns DEFAULT_COMPANION_SIZE when size is NaN", () => {
    expect(normalizeCompanionSize(NaN)).toBe(DEFAULT_COMPANION_SIZE);
  });
});
