import { useCallback, useEffect, useState } from "react";

const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoints.mobile : false,
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= breakpoints.mobile &&
          window.innerWidth < breakpoints.desktop
      : false,
  );
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= breakpoints.desktop
      : false,
  );

  const getWindowDimensions = () => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update specific state
    const doc = document.documentElement;
    doc.style.setProperty("--app-height", `${height}px`);

    // Update device type based on width
    setIsMobile(width < breakpoints.mobile);
    setIsTablet(width >= breakpoints.mobile && width < breakpoints.desktop);
    setIsDesktop(width >= breakpoints.desktop);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional empty dependency array
  useEffect(() => {
    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  const isIOS = useCallback(() => {
    if (typeof window === "undefined" || !window.navigator) return false;
    const userAgent =
      // @ts-expect-error
      window.navigator.userAgent || window.navigator.vendor || window.opera;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
  }, []);

  const isTouchDevice = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    getWindowDimensions,
    isIOS,
    isTouchDevice,
  };
};
