import type { CSSProperties } from "react";
import { useRef } from "react";
import { useMoireEffect } from "./useMoireEffect";
import "./Moire.css";

interface MagicComponentProps {
  isVisible?: boolean;
  opacity?: number;
}

function MagicComponent({
  isVisible = true,
  opacity = 0.2,
}: MagicComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityStyle = {
    opacity: isVisible ? opacity : 0,
  } satisfies CSSProperties;

  useMoireEffect(containerRef);

  return <div id="magicContainer" ref={containerRef} style={visibilityStyle} />;
}

export default MagicComponent;
