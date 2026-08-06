import type React from "react";

// * Handle smooth scrolling for hash navigation
export const handleNavClick = (e: React.MouseEvent, href: string) => {
  // Only intercept hash links (#anchor or /#anchor)
  if (href.includes("#")) {
    e.preventDefault();

    // Extract the ID from URLs like "/#about" or "#about"
    const hashIndex = href.indexOf("#");
    const targetId = href.substring(hashIndex + 1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
};
