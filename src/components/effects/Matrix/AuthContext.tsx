import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getWindowDimensions } from "../../../utils/commonUtils";

const STORAGE_PREFIX = "matrix_auth_";
const SESSION_KEYS = {
  UNLOCKED: `${STORAGE_PREFIX}unlocked`,
  MOBILE_UNLOCKED: `${STORAGE_PREFIX}mobile_unlocked`,
};

const ERROR_MESSAGES = {
  STORAGE_ERROR: "Failed to access session storage",
};

const hasSessionStorage = () => {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.sessionStorage !== "undefined"
    );
  } catch (_e) {
    return false;
  }
};

// biome-ignore lint/suspicious/noExplicitAny: generic storage value
const setSessionData = (key: string, value: any) => {
  if (!hasSessionStorage()) {
    return;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  // biome-ignore lint/suspicious/noExplicitAny: catch clause error
  } catch (error: any) {
    console.warn(`${ERROR_MESSAGES.STORAGE_ERROR} for ${key}:`, error);
    if (error.name === "QuotaExceededError") {
      try {
        Object.values(SESSION_KEYS).forEach((k) => { clearSessionData(k); });
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (retryError) {
        console.error("Failed to recover from quota exceeded error:", retryError);
      }
    }
  }
};

const getSessionData = (key: string, defaultValue = false) => {
  if (!hasSessionStorage()) {
    return defaultValue;
  }
  try {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`${ERROR_MESSAGES.STORAGE_ERROR} for ${key}:`, error);
    return defaultValue;
  }
};

const clearSessionData = (key: string) => {
  if (!hasSessionStorage()) {
    return;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`${ERROR_MESSAGES.STORAGE_ERROR} for ${key}:`, error);
  }
};

interface AuthContextType {
  isUnlocked: boolean;
  isMobileUnlocked: boolean;
  completeHack: () => void;
  showSuccessFeedback: boolean;
  logout: () => void;
  isMobile: boolean;
  toolsAccessible: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  isMobileUnlocked: false,
  completeHack: () => {},
  showSuccessFeedback: false,
  logout: () => {},
  isMobile: false,
  toolsAccessible: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [unlockState, setUnlockState] = useState(() => ({
    isUnlocked: getSessionData(SESSION_KEYS.UNLOCKED),
    isMobileUnlocked: getSessionData(SESSION_KEYS.MOBILE_UNLOCKED),
  }));

  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const { width } = getWindowDimensions();
      setIsMobile(width < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const completeHack = useCallback(() => {
    const newState = { ...unlockState };
    if (isMobile) {
      newState.isMobileUnlocked = true;
      setSessionData(SESSION_KEYS.MOBILE_UNLOCKED, true);
    } else {
      newState.isUnlocked = true;
      setSessionData(SESSION_KEYS.UNLOCKED, true);
    }
    setUnlockState(newState);
    setShowSuccessFeedback(true);
    setTimeout(() => setShowSuccessFeedback(false), 2000);
  }, [isMobile, unlockState]);

  const logout = useCallback(() => {
    clearSessionData(SESSION_KEYS.UNLOCKED);
    clearSessionData(SESSION_KEYS.MOBILE_UNLOCKED);
    setUnlockState({
      isUnlocked: false,
      isMobileUnlocked: false,
    });
  }, []);

  const {
    isUnlocked,
    isMobileUnlocked,
  } = unlockState;

  const toolsAccessible = useMemo(() => {
    if (isMobile) {
      return isMobileUnlocked;
    }
    return isUnlocked;
  }, [isMobile, isMobileUnlocked, isUnlocked]);

  return (
    <AuthContext.Provider
      value={useMemo(
        () => ({
          isUnlocked,
          isMobileUnlocked,
          toolsAccessible,
          completeHack,
          showSuccessFeedback,
          logout,
          isMobile,
        }),
        [
          isUnlocked,
          isMobileUnlocked,
          toolsAccessible,
          completeHack,
          showSuccessFeedback,
          logout,
          isMobile,
        ],
      )}
    >
      {children}
    </AuthContext.Provider>
  );
};
