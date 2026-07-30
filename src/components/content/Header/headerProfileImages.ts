import profileAvatarDefault from "../../../assets/images/profile-avatar-default.png";
import profileAvatarOutdoor from "../../../assets/images/profile-avatar-outdoor.png";
import profileAvatarStudio from "../../../assets/images/profile-avatar-studio.png";
import profileAvatarFallback from "../../../assets/images/profile-avatar-fallback.png";

/** Largest avatar intrinsic width (used for layout hints on non-profile icons). */
export const PROFILE_IMAGE_WIDTH = 1024;
export const PROFILE_IMAGE_HEIGHT = 1024;

export interface ProfileImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  isFallback?: boolean;
}

export const PROFILE_IMAGES: ProfileImage[] = [
  {
    src: profileAvatarDefault,
    alt: "Aaron Lorenzo Woods — default profile photo",
    width: 1024,
    height: 1024,
  },
  {
    src: profileAvatarOutdoor,
    alt: "Aaron Lorenzo Woods — outdoor profile photo",
    width: 800,
    height: 800,
  },
  {
    src: profileAvatarStudio,
    alt: "Aaron Lorenzo Woods — studio profile photo",
    width: 500,
    height: 500,
  },
  {
    src: profileAvatarFallback,
    alt: "Aaron Lorenzo Woods — profile photo",
    width: 400,
    height: 400,
    isFallback: true,
  },
];

export const FALLBACK_PROFILE_SRC =
  PROFILE_IMAGES.find((image) => image.isFallback)?.src ??
  PROFILE_IMAGES[0].src;

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
