import {
  DEFAULT_LCP_WEBP_SRC,
  FALLBACK_PROFILE_SRC,
  FALLBACK_PROFILE_WEBP_SRC,
  getInitialLcpImageSrc,
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
    expect(getInitialLcpImageSrc()).toBe(DEFAULT_LCP_WEBP_SRC);
  });

  it("returns stored index when valid", () => {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, "2");

    expect(readStoredProfileIndex()).toBe(2);
    expect(getInitialLcpImageSrc()).toBe(PROFILE_IMAGES[2].webpSrc);
  });

  it("clamps invalid stored index back to 0", () => {
    sessionStorage.setItem(PROFILE_INDEX_STORAGE_KEY, "99");

    expect(readStoredProfileIndex()).toBe(0);
    expect(getInitialProfileSrc()).toBe(PROFILE_IMAGES[0].src);
  });

  it("exports fallback profile src and webp src directly without runtime search", () => {
    expect(FALLBACK_PROFILE_SRC).toBe(
      PROFILE_IMAGES.find((img) => img.isFallback)?.src,
    );
    expect(FALLBACK_PROFILE_WEBP_SRC).toBe(
      PROFILE_IMAGES.find((img) => img.isFallback)?.webpSrc,
    );
  });
});
