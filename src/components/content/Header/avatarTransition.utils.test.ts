import {
  getAvatarFrameClassName,
  getClickTransitionState,
  getNextPhaseOnFrameEnd,
  getNextPhaseOnPhotoEnd,
  persistProfileIndex,
} from "./avatarTransition.utils";
import { PROFILE_INDEX_STORAGE_KEY } from "./headerProfileImages";

describe("avatarTransition.utils", () => {
  describe("getClickTransitionState", () => {
    it("returns shrink phase and shouldExpand true when hovered", () => {
      expect(getClickTransitionState(0, 3, true)).toEqual({
        nextIndex: 1,
        initialPhase: "shrink",
        shouldExpand: true,
      });
    });

    it("returns slideOut phase and shouldExpand false when not hovered", () => {
      expect(getClickTransitionState(0, 3, false)).toEqual({
        nextIndex: 1,
        initialPhase: "slideOut",
        shouldExpand: false,
      });
    });

    it("wraps around nextIndex correctly", () => {
      expect(getClickTransitionState(2, 3, false)).toEqual({
        nextIndex: 0,
        initialPhase: "slideOut",
        shouldExpand: false,
      });
    });
  });

  describe("getAvatarFrameClassName", () => {
    it("returns correct class names for all phases", () => {
      expect(getAvatarFrameClassName("idle", false)).toBe("avatar");

      expect(getAvatarFrameClassName("shrink", false)).toBe(
        "avatar avatar--transitioning avatar--scale-from-hover",
      );
      expect(getAvatarFrameClassName("shrink", true)).toBe(
        "avatar avatar--transitioning avatar--scale-rest",
      );

      expect(getAvatarFrameClassName("slideOut", false)).toBe(
        "avatar avatar--transitioning avatar--scale-rest",
      );
      expect(getAvatarFrameClassName("slideIn", true)).toBe(
        "avatar avatar--transitioning avatar--scale-rest",
      );

      expect(getAvatarFrameClassName("expand", false)).toBe(
        "avatar avatar--transitioning avatar--scale-rest",
      );
      expect(getAvatarFrameClassName("expand", true)).toBe(
        "avatar avatar--transitioning avatar--scale-hover",
      );
    });
  });

  describe("getNextPhaseOnFrameEnd", () => {
    it("returns slideOut when shrink phase ends", () => {
      expect(getNextPhaseOnFrameEnd("shrink")).toEqual({
        nextPhase: "slideOut",
      });
    });

    it("returns shouldComplete when expand phase ends", () => {
      expect(getNextPhaseOnFrameEnd("expand")).toEqual({
        shouldComplete: true,
      });
    });

    it("returns empty object for other phases", () => {
      expect(getNextPhaseOnFrameEnd("idle")).toEqual({});
    });
  });

  describe("getNextPhaseOnPhotoEnd", () => {
    it("returns slideIn when slideOut phase ends", () => {
      expect(getNextPhaseOnPhotoEnd("slideOut", false)).toEqual({
        nextPhase: "slideIn",
      });
    });

    it("returns expand when slideIn phase ends and shouldExpand is true", () => {
      expect(getNextPhaseOnPhotoEnd("slideIn", true)).toEqual({
        nextPhase: "expand",
      });
    });

    it("returns shouldComplete when slideIn phase ends and shouldExpand is false", () => {
      expect(getNextPhaseOnPhotoEnd("slideIn", false)).toEqual({
        shouldComplete: true,
      });
    });

    it("returns empty object for other phases", () => {
      expect(getNextPhaseOnPhotoEnd("idle", false)).toEqual({});
    });
  });

  describe("persistProfileIndex", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("saves profile index to sessionStorage", () => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
      persistProfileIndex(2);
      expect(setItemSpy).toHaveBeenCalledWith(PROFILE_INDEX_STORAGE_KEY, "2");
    });

    it("handles sessionStorage errors gracefully", () => {
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => persistProfileIndex(1)).not.toThrow();
    });
  });
});
