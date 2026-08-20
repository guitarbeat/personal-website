jest.mock("../../vendor/proof/companionGeometry.ts", () => ({
  companionWidth: jest.fn(() => 100),
}));

import { companionShadowStyle, DIRECT_FEEDBACK_EASING } from "../../vendor/proof/companionChrome";

describe("companionShadowStyle", () => {
  it("returns base styles for settled phase", () => {
    const style = companionShadowStyle({ phase: "settled", reduceMotion: false });
    expect(style.opacity).toBe(1);
    expect(style.transform).toBe("scaleX(1)");
    expect(style.transition).toBe(`opacity 140ms ${DIRECT_FEEDBACK_EASING}, transform 140ms ${DIRECT_FEEDBACK_EASING}`);
  });

  it("adjusts opacity and transform during dragging", () => {
    const style = companionShadowStyle({ phase: "dragging", reduceMotion: false });
    expect(style.opacity).toBe(0.72);
    expect(style.transform).toBe("scaleX(0.82)");
  });

  it("adjusts opacity and transform during pressing", () => {
    const style = companionShadowStyle({ phase: "pressing", reduceMotion: false });
    expect(style.opacity).toBe(0.88);
    expect(style.transform).toBe("scaleX(0.92)");
  });

  it("disables transitions when reduceMotion is true", () => {
    const style = companionShadowStyle({ phase: "settled", reduceMotion: true });
    expect(style.transition).toBe("none");
  });
});
