import profileAvatarDefault from "../../../assets/images/profile-avatar-default.png";
import profileAvatarFallback from "../../../assets/images/profile-avatar-fallback.png";
import profileAvatarFallbackWebp from "../../../assets/images/profile-avatar-fallback.webp";
import profileAvatarOutdoor from "../../../assets/images/profile-avatar-outdoor.png";
import profileAvatarOutdoorWebp from "../../../assets/images/profile-avatar-outdoor.webp";
import profileAvatarStudio from "../../../assets/images/profile-avatar-studio.png";
import profileAvatarStudioWebp from "../../../assets/images/profile-avatar-studio.webp";

/** Stable URL for HTML preload; copied to public/lcp/ by compress-images. */
export const DEFAULT_LCP_WEBP_SRC = "/lcp/profile-avatar-default.webp";

/** Display size after WebP resize (matches header avatar slot). */
export const PROFILE_IMAGE_WIDTH = 400;
export const PROFILE_IMAGE_HEIGHT = 400;

export interface ProfileImage {
  src: string;
  webpSrc: string;
  alt: string;
  width: number;
  height: number;
  isFallback?: boolean;
}

export const PROFILE_IMAGES: ProfileImage[] = [
  {
    src: profileAvatarDefault,
    webpSrc: DEFAULT_LCP_WEBP_SRC,
    alt: "Aaron Lorenzo Woods — default profile photo",
    width: PROFILE_IMAGE_WIDTH,
    height: PROFILE_IMAGE_HEIGHT,
  },
  {
    src: profileAvatarOutdoor,
    webpSrc: profileAvatarOutdoorWebp,
    alt: "Aaron Lorenzo Woods — outdoor profile photo",
    width: PROFILE_IMAGE_WIDTH,
    height: PROFILE_IMAGE_HEIGHT,
  },
  {
    src: profileAvatarStudio,
    webpSrc: profileAvatarStudioWebp,
    alt: "Aaron Lorenzo Woods — studio profile photo",
    width: PROFILE_IMAGE_WIDTH,
    height: PROFILE_IMAGE_HEIGHT,
  },
  {
    src: profileAvatarFallback,
    webpSrc: profileAvatarFallbackWebp,
    alt: "Aaron Lorenzo Woods — profile photo",
    width: PROFILE_IMAGE_WIDTH,
    height: PROFILE_IMAGE_HEIGHT,
    isFallback: true,
  },
];

export const FALLBACK_PROFILE_SRC = profileAvatarFallback;

export const FALLBACK_PROFILE_WEBP_SRC = profileAvatarFallbackWebp;

export const PROFILE_INDEX_STORAGE_KEY = "header-profile-index";

export function readStoredProfileIndex(): number {
  if (typeof sessionStorage === "undefined") {
    return 0;
  }

  try {
    const raw = sessionStorage.getItem(PROFILE_INDEX_STORAGE_KEY);
    if (raw === null) {
      return 0;
    }

    const parsed = Number.parseInt(raw, 10);
    if (
      !Number.isFinite(parsed) ||
      parsed < 0 ||
      parsed >= PROFILE_IMAGES.length
    ) {
      return 0;
    }

    return parsed;
  } catch {
    return 0;
  }
}

export function getInitialProfileSrc(): string {
  return PROFILE_IMAGES[readStoredProfileIndex()].src;
}

export function getInitialLcpImageSrc(): string {
  return PROFILE_IMAGES[readStoredProfileIndex()].webpSrc;
}
