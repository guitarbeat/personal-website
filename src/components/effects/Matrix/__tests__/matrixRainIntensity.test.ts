import {
  getMatrixRainDrawParams,
  getMatrixRainIntensity,
  getReducedMotionRainIntensity,
} from "../matrixRainIntensity";

describe("matrixRainIntensity", () => {
  it("returns base intensity at session start (12% progress)", () => {
    expect(getMatrixRainIntensity(12)).toBeCloseTo(0.12, 2);
  });

  it("clamps intensity at 0 and 1", () => {
    expect(getMatrixRainIntensity(-10)).toBeCloseTo(0.12, 2);
    expect(getMatrixRainIntensity(0)).toBeCloseTo(0.12, 2);
    expect(getMatrixRainIntensity(100)).toBe(1);
    expect(getMatrixRainIntensity(150)).toBe(1);
  });

  it("increases monotonically with progress", () => {
    const samples = [0, 12, 33, 50, 66, 85, 100].map(getMatrixRainIntensity);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it("applies phase boosts at 33 and 66", () => {
    const at32 = getMatrixRainIntensity(32);
    const at33 = getMatrixRainIntensity(33);
    const at65 = getMatrixRainIntensity(65);
    const at66 = getMatrixRainIntensity(66);

    expect(at33).toBeGreaterThan(at32);
    expect(at66).toBeGreaterThan(at65);
  });

  it("returns denser draw params as intensity rises", () => {
    const low = getMatrixRainDrawParams(0.1);
    const high = getMatrixRainDrawParams(0.9);

    expect(high.fadeAlpha).toBeLessThan(low.fadeAlpha);
    expect(high.opacityMultiplier).toBeGreaterThan(low.opacityMultiplier);
    expect(high.speedMultiplier).toBeGreaterThan(low.speedMultiplier);
    expect(high.brightHeadThreshold).toBeLessThan(low.brightHeadThreshold);
  });

  it("caps reduced-motion intensity", () => {
    expect(getReducedMotionRainIntensity()).toBe(0.2);
  });
});
