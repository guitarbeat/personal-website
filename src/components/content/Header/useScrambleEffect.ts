import { useEffect } from "react";
import { isAboveBreakpoint, randomInt } from "@/utils/commonUtils";

const DESKTOP_BREAKPOINT = 768;

export default function useScrambleEffect(
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!ref?.current) {
      return undefined;
    }

    const eventHandlers = new Map();

    const enhance = () => {
      if (isAboveBreakpoint(DESKTOP_BREAKPOINT) && ref.current) {
        const headers = Array.from(
          ref.current.querySelectorAll("h1,h2,h3"),
        ) as HTMLElement[];
        for (const header of headers) {
          const letters = (header.textContent || "").split("");
          header.textContent = "";
          const fragment = document.createDocumentFragment();
          for (const letter of letters) {
            const span = document.createElement("span");
            span.className = "letter";
            span.textContent = letter === " " ? " " : letter;
            fragment.appendChild(span);
          }
          header.appendChild(fragment);
        }

        const letterElements = Array.from(
          ref.current.querySelectorAll(".letter"),
        ) as HTMLElement[];
        for (const letter of letterElements) {
          const handleMouseOver = (e: Event) => {
            const target = e.target as HTMLElement;
            target.style.setProperty("--x", `${randomInt(-10, 10)}px`);
            target.style.setProperty("--y", `${randomInt(-10, 10)}px`);
            target.style.setProperty("--r", `${randomInt(-10, 10)}deg`);
          };

          const handleMouseOut = (e: Event) => {
            const target = e.target as HTMLElement;
            target.style.setProperty("--x", "0px");
            target.style.setProperty("--y", "0px");
            target.style.setProperty("--r", "0deg");
          };

          eventHandlers.set(letter, {
            mouseover: handleMouseOver,
            mouseout: handleMouseOut,
          });

          letter.addEventListener("mouseover", handleMouseOver);
          letter.addEventListener("mouseout", handleMouseOut);
        }
      }
    };

    enhance();

    return () => {
      eventHandlers.forEach((handlers, letter) => {
        letter.removeEventListener("mouseover", handlers.mouseover);
        letter.removeEventListener("mouseout", handlers.mouseout);
      });
      eventHandlers.clear();
    };
  }, [ref]);
}
