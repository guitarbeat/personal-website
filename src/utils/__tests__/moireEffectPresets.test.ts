import { createProjectEffect, DEFAULT_PROJECT_EFFECT } from "../moireEffectPresets";

describe("createProjectEffect", () => {
  it("should return default colors if tagColor is undefined", () => {
    const result = createProjectEffect(undefined, 0);
    expect(result.colors).toEqual(DEFAULT_PROJECT_EFFECT.colors);
    expect(result.gap).toBe(8); // 8 + (0 % 3) * 2
    expect(result.speed).toBe(18); // 18 + (0 % 4) * 3
  });

  it("should return default colors if tagColor is an invalid HSL string", () => {
    const result = createProjectEffect("invalid-color", 1);
    expect(result.colors).toEqual(DEFAULT_PROJECT_EFFECT.colors);
    expect(result.gap).toBe(10); // 8 + (1 % 3) * 2
    expect(result.speed).toBe(21); // 18 + (1 % 4) * 3
  });

  it("should calculate palette correctly for a valid HSL string", () => {
    const result = createProjectEffect("hsl(200, 50%, 50%)", 2);
    // h: 200, s: 50, l: 50
    // accent: hsl(200, clamp(50 + 12)%, clamp(50 + 18)%) -> hsl(200, 62%, 68%)
    // base: hsl(200, clamp(50 + 6)%, clamp(50 + 6)%) -> hsl(200, 56%, 56%)
    // shadow: hsl(200, clamp(50 + 4)%, clamp(50 - 10)%) -> hsl(200, 54%, 40%)
    expect(result.colors).toEqual([
      "hsl(200, 62%, 68%)",
      "hsl(200, 56%, 56%)",
      "hsl(200, 54%, 40%)",
    ]);
    expect(result.gap).toBe(12); // 8 + (2 % 3) * 2
    expect(result.speed).toBe(24); // 18 + (2 % 4) * 3
  });

  it("should clamp values correctly when saturation and lightness are near boundaries", () => {
    const result = createProjectEffect("hsl(300, 95%, 90%)", 3);
    // h: 300, s: 95, l: 90
    // accent: s=clamp(107)=100, l=clamp(108)=96 -> hsl(300, 100%, 96%)
    // base: s=clamp(101)=100, l=clamp(96)=96 -> hsl(300, 100%, 96%)
    // shadow: s=clamp(99)=99, l=clamp(80, 4, 92)=80 -> hsl(300, 99%, 80%)
    expect(result.colors).toEqual([
      "hsl(300, 100%, 96%)",
      "hsl(300, 100%, 96%)",
      "hsl(300, 99%, 80%)",
    ]);
    expect(result.gap).toBe(8); // 8 + (3 % 3) * 2 -> 8 + 0
    expect(result.speed).toBe(27); // 18 + (3 % 4) * 3 -> 18 + 9
  });

  it("should calculate varying gap and speed across different indices", () => {
    const r4 = createProjectEffect(undefined, 4);
    expect(r4.gap).toBe(10); // 8 + (4%3)*2 = 10
    expect(r4.speed).toBe(18); // 18 + (4%4)*3 = 18

    const r5 = createProjectEffect(undefined, 5);
    expect(r5.gap).toBe(12); // 8 + (5%3)*2 = 12
    expect(r5.speed).toBe(21); // 18 + (5%4)*3 = 21
  });
});
