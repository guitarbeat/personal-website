import { useCallback, useEffect, useState } from "react";
import { debounce } from "../utils/commonUtils";

const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export const useMobileDetection = (
  customBreakpoints?: Partial<typeof DEFAULT_BREAKPOINTS>,
) => {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setScreenSize({ width, height });
    setIsLandscape(width > height);

    // Update device type based on width
    setIsMobile(width < breakpoints.mobile);
    setIsTablet(width >= breakpoints.mobile && width < breakpoints.desktop);
    setIsDesktop(width >= breakpoints.desktop);
  }, [breakpoints.desktop, breakpoints.mobile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Initial check
    updateScreenSize();

    // Debounced resize handler
    const handleResize = debounce(() => {
      updateScreenSize();
    }, 200);

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateScreenSize]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    screenSize,
  };
};
