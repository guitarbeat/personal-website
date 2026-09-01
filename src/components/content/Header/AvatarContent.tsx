import type React from "react";
import { cn } from "@/utils/commonUtils";
import { AvatarImage } from "./AvatarImage";
import type { AvatarPhase } from "./avatarTransition.utils";

interface AvatarContentProps {
  phase: AvatarPhase;
  profileIndex: number;
  outgoingIndex: number | null;
  incomingIndex: number | null;
  phaseAnimating: boolean;
  onPhotoTransitionEnd: (e: React.TransitionEvent<HTMLImageElement>) => void;
}

export function AvatarContent({
  phase,
  profileIndex,
  outgoingIndex,
  incomingIndex,
  phaseAnimating,
  onPhotoTransitionEnd,
}: AvatarContentProps) {
  if (phase === "idle") {
    return (
      <AvatarImage
        index={profileIndex}
        className="avatar__photo--active"
        fetchPriority="high"
      />
    );
  }

  if ((phase === "shrink" || phase === "slideOut") && outgoingIndex !== null) {
    return (
      <AvatarImage
        index={outgoingIndex}
        className={cn(
          "avatar__photo--outgoing",
          phase === "slideOut" &&
            phaseAnimating &&
            "avatar__photo--outgoing-exiting",
        )}
        onTransitionEnd={
          phase === "slideOut" ? onPhotoTransitionEnd : undefined
        }
      />
    );
  }

  if ((phase === "slideIn" || phase === "expand") && incomingIndex !== null) {
    const photoClassName =
      phase === "expand"
        ? "avatar__photo--active"
        : cn(
            "avatar__photo--incoming",
            phaseAnimating && "avatar__photo--incoming-active",
          );

    return (
      <AvatarImage
        index={incomingIndex}
        className={photoClassName}
        onTransitionEnd={phase === "slideIn" ? onPhotoTransitionEnd : undefined}
      />
    );
  }

  return null;
}
