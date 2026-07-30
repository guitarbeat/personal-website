import profile1 from "../../../assets/images/profile1-nbg.png";
import profile3 from "../../../assets/images/profile1v2-nbg.png";
import profile2 from "../../../assets/images/profile2-nbg.png";
import profile4 from "../../../assets/images/profile4.png";

export const PROFILE_IMAGE_WIDTH = 1024;
export const PROFILE_IMAGE_HEIGHT = 1024;

export interface ProfileImage {
  src: string;
  alt: string;
  isFallback?: boolean;
}

export const PROFILE_IMAGES: ProfileImage[] = [
  { src: profile1, alt: "Profile one" },
  { src: profile2, alt: "Profile two" },
  { src: profile3, alt: "Profile three" },
  { src: profile4, alt: "Profile four", isFallback: true },
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
