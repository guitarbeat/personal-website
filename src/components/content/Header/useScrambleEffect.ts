import { useEffect } from "react";
import { isAboveBreakpoint, randomInt } from "../../../utils/commonUtils";

// * Breakpoint constant - matches SCSS breakpoint system
const DESKTOP_BREAKPOINT = 768;

export default function useScrambleEffect(
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    // * Early return if ref is not available
    if (!ref?.current) {
      return undefined;
    }

    const currentRef = ref.current;

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.classList?.contains("letter")) {
        target.style.setProperty("--x", `${randomInt(-10, 10)}px`);
        target.style.setProperty("--y", `${randomInt(-10, 10)}px`);
        target.style.setProperty("--r", `${randomInt(-10, 10)}deg`);
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.classList?.contains("letter")) {
        target.style.setProperty("--x", "0px");
        target.style.setProperty("--y", "0px");
        target.style.setProperty("--r", "0deg");
      }
    };

    const enhance = () => {
      if (isAboveBreakpoint(DESKTOP_BREAKPOINT) && currentRef) {
        const headers = Array.from(
          currentRef.querySelectorAll("h1,h2,h3"),
        ) as HTMLElement[];
        for (const header of headers) {
          const letters = (header.textContent || "").split("");
          header.textContent = "";
          for (const letter of letters) {
            const span = document.createElement("span");
            span.className = "letter";
            if (letter === " ") {
              span.innerHTML = "&nbsp;";
            } else {
              span.textContent = letter;
            }
            header.appendChild(span);
          }
        }
      }
    };

    enhance();

    // * Add event listeners using event delegation
    currentRef.addEventListener("mouseover", handleMouseOver);
    currentRef.addEventListener("mouseout", handleMouseOut);

    // * Cleanup function to remove event listeners
    return () => {
      currentRef.removeEventListener("mouseover", handleMouseOver);
      currentRef.removeEventListener("mouseout", handleMouseOut);
    };
  }, [ref]);
}
