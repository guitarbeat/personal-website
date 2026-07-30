import {
  getInitialProfileSrc,
  PROFILE_IMAGES,
  PROFILE_INDEX_STORAGE_KEY,
  readStoredProfileIndex,
} from "./headerProfileImages";

describe("headerProfileImages", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("defaults to index 0 when session storage is empty", () => {
    expect(readStoredProfileIndex()).toBe(0);
    expect(getInitialProfileSrc()).toBe(PROFILE_IMAGES[0].src);
  });

  it("returns stored index when valid", () => {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, "2");

    expect(readStoredProfileIndex()).toBe(2);
    expect(getInitialProfileSrc()).toBe(PROFILE_IMAGES[2].src);
  });

  it("clamps invalid stored index back to 0", () => {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, "99");

    expect(readStoredProfileIndex()).toBe(0);
    expect(getInitialProfileSrc()).toBe(PROFILE_IMAGES[0].src);
  });
});
