import type React from "react";
import { cn } from "@/utils/commonUtils";
import {
  FALLBACK_PROFILE_SRC,
  FALLBACK_PROFILE_WEBP_SRC,
  PROFILE_IMAGES,
} from "./headerProfileImages";

export function handleAvatarImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
): void {
  const target = e.currentTarget;
  target.onerror = null;
  target.src = FALLBACK_PROFILE_SRC;

  const picture = target.closest("picture");
  const source = picture?.querySelector("source");
  if (source) {
    source.setAttribute("srcset", FALLBACK_PROFILE_WEBP_SRC);
  }
}

interface AvatarImageProps {
  index: number;
  className: string;
  fetchPriority?: "high";
  onTransitionEnd?: (e: React.TransitionEvent<HTMLImageElement>) => void;
}

export function AvatarImage({
  index,
  className,
  fetchPriority,
  onTransitionEnd,
}: AvatarImageProps) {
  const image = PROFILE_IMAGES[index];

  return (
    <picture key={image.webpSrc}>
      <source srcSet={image.webpSrc} type="image/webp" />
      <img
        className={cn("avatar__photo", className)}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        fetchPriority={fetchPriority}
        onError={handleAvatarImageError}
        onTransitionEnd={onTransitionEnd}
      />
    </picture>
  );
}
