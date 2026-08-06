import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Theme Configuration
export const THEME = {
  LIGHT: "light",
  DARK: "dark",
  STORAGE_KEY: "theme",
  CLASS_NAME: "light-theme",
};

const isBrowser = typeof window !== "undefined";
const isDocumentAvailable = typeof document !== "undefined";
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

const getInitialTheme = () => {
  if (!isBrowser) {
    return false;
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME.STORAGE_KEY);
    if (savedTheme) {
      return savedTheme === THEME.LIGHT;
    }
  } catch (_error) {
    // Swallow storage access errors (Safari private mode, etc.)
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }

  return false;
};

const updateThemeColor = (isLight: boolean) => {
  if (!isDocumentAvailable) {
    return;
  }

  const themeColor = isLight ? "#ffffff" : "#1a1a1a";
  const existingMeta =
    document.querySelector("meta#theme-color") ??
    document.querySelector('meta[name="theme-color"]');

  if (existingMeta) {
    existingMeta.setAttribute("content", themeColor);
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.id = "theme-color";
  meta.setAttribute("content", themeColor);
  document.head.appendChild(meta);
};

export function useTheme(onMatrixActivate: () => void) {
  const themeClickTimesRef = useRef<number[]>([]);
  const themeSwitchRef = useRef<HTMLButtonElement>(null);
  const [isLightTheme, setIsLightTheme] = useState(getInitialTheme);

  const handleThemeClick = useCallback(() => {
    const now = Date.now();
    const clickTimes = themeClickTimesRef.current;

    clickTimes.push(now);

    while (clickTimes.length > 0 && now - clickTimes[0] >= 2000) {
      clickTimes.shift();
    }

    if (clickTimes.length >= 5) {
      clickTimes.length = 0;
      if (onMatrixActivate) {
        onMatrixActivate();
      }
    }

    const nextIsLightTheme = !isLightTheme;
    setIsLightTheme(nextIsLightTheme);
  }, [isLightTheme, onMatrixActivate]);

  useIsomorphicLayoutEffect(() => {
    if (!isDocumentAvailable) {
      return;
    }

    document.body.classList.toggle(THEME.CLASS_NAME, isLightTheme);
    updateThemeColor(isLightTheme);
  }, [isLightTheme]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(
        THEME.STORAGE_KEY,
        isLightTheme ? THEME.LIGHT : THEME.DARK,
      );
    } catch (_error) {
      // Ignore persistence failures (quota restrictions, etc.)
    }
  }, [isLightTheme]);

  return { isLightTheme, handleThemeClick, themeSwitchRef };
}
