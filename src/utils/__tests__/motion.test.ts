import type { TransitionEvent } from "react";
import { isAvatarScaleTransition, prefersReducedMotion } from "../motion";

describe("motion utilities", () => {
  describe("prefersReducedMotion", () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeAll(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterAll(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("returns false if window.matchMedia is not a function", () => {
      // @ts-expect-error - simulating missing matchMedia
      window.matchMedia = undefined;
      expect(prefersReducedMotion()).toBe(false);
    });

    it("returns true if user prefers reduced motion", () => {
      window.matchMedia = jest.fn().mockImplementation((query) => {
        return {
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it("returns false if user does not prefer reduced motion", () => {
      window.matchMedia = jest.fn().mockImplementation((query) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe("isAvatarScaleTransition", () => {
    it("returns true when propertyName is transform", () => {
      const event = {
        propertyName: "transform",
      } as TransitionEvent<HTMLElement>;
      expect(isAvatarScaleTransition(event)).toBe(true);
    });

    it("returns true when propertyName is --init-scale", () => {
      const event = {
        propertyName: "--init-scale",
      } as TransitionEvent<HTMLElement>;
      expect(isAvatarScaleTransition(event)).toBe(true);
    });

    it("returns true when propertyName is undefined or empty", () => {
      const event = { propertyName: "" } as TransitionEvent<HTMLElement>;
      expect(isAvatarScaleTransition(event)).toBe(true);

      const event2 = {} as TransitionEvent<HTMLElement>;
      expect(isAvatarScaleTransition(event2)).toBe(true);
    });

    it("returns false for other properties", () => {
      const event = { propertyName: "opacity" } as TransitionEvent<HTMLElement>;
      expect(isAvatarScaleTransition(event)).toBe(false);
    });
  });
});
