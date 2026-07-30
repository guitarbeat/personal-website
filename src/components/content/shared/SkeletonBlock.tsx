import { cn } from "@/utils/commonUtils";

type SkeletonVariant = "text" | "image" | "card" | "button";

interface SkeletonBlockProps {
  className?: string;
  variant?: SkeletonVariant;
}

export function SkeletonBlock({
  className,
  variant = "text",
}: SkeletonBlockProps) {
  return (
    <div
      className={cn("enhanced-skeleton", `enhanced-skeleton--${variant}`, className)}
      aria-hidden="true"
    />
  );
}
