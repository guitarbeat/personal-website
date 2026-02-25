import { getWindowDimensions } from "../commonUtils";

describe("commonUtils", () => {
  describe("getWindowDimensions", () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it("returns correct dimensions when window is defined", () => {
      // Setup
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;

      // Execute
      const result = getWindowDimensions();

      // Verify
      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it("returns zero dimensions when window is undefined", () => {
      // Setup
      // @ts-ignore
      delete global.window;

      // Execute
      const result = getWindowDimensions();

      // Verify
      expect(result).toEqual({ width: 0, height: 0 });
    });
  });
});
