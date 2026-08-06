// Third-party imports
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Hook imports
import { useMobileDetection } from "@/hooks/useMobileDetection";

// Constants
import { ANIMATION_TIMING, ERROR_MESSAGES, UNLOCK } from "./constants";

interface UnlockContextType {
  isUnlocked: boolean;
  isMobileUnlocked: boolean;
  toolsAccessible: boolean;
  completeHack: () => boolean;
  showHackCompleteFeedback: boolean;
  logout: () => void;
  isMobile: boolean;
}

const UnlockContext = createContext<UnlockContextType | null>(null);

// * Browser sessionStorage keys
const STORAGE_KEYS = {
  IS_UNLOCKED: "matrix_unlocked",
  UNLOCK_TIMESTAMP: "matrix_unlock_timestamp",
  MOBILE_UNLOCKED: "matrix_mobile_unlocked",
  MOBILE_UNLOCK_TIMESTAMP: "matrix_mobile_unlock_timestamp",
};

const DEVICE_KEYS = {
  DEFAULT: "default",
  MOBILE: "mobile",
};

const STORAGE_CONFIG = {
  [DEVICE_KEYS.DEFAULT]: {
    unlockedKey: STORAGE_KEYS.IS_UNLOCKED,
    timestampKey: STORAGE_KEYS.UNLOCK_TIMESTAMP,
  },
  [DEVICE_KEYS.MOBILE]: {
    unlockedKey: STORAGE_KEYS.MOBILE_UNLOCKED,
    timestampKey: STORAGE_KEYS.MOBILE_UNLOCK_TIMESTAMP,
  },
};

const INITIAL_UNLOCK_STATE = {
  [DEVICE_KEYS.DEFAULT]: false,
  [DEVICE_KEYS.MOBILE]: false,
};

const hasSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

// * sessionStorage utilities
const getSessionData = (key: string) => {
  if (!hasSessionStorage()) {
    return null;
  }

  try {
    const data = window.sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`${ERROR_MESSAGES.STORAGE_ERROR} for ${key}:`, error);
    return null;
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

const setSessionData = (key: string, value: unknown) => {
  if (!hasSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`${ERROR_MESSAGES.STORAGE_ERROR} for ${key}:`, error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      try {
        // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach used for side effect
        Object.values(STORAGE_KEYS).forEach((k) => clearSessionData(k));
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (retryError) {
        throw new Error(
          `${ERROR_MESSAGES.STORAGE_ERROR} even after cleanup: ${
            retryError instanceof Error
              ? retryError.message
              : String(retryError)
          }`,
        );
      }
    }
  }
};

const readUnlockStateFromStorage = () => {
  const unlockState = { ...INITIAL_UNLOCK_STATE };
  const maxUnlockAge = UNLOCK.WINDOW_MS;

  for (const [device, keys] of Object.entries(STORAGE_CONFIG)) {
    const isStoredUnlocked = getSessionData(keys.unlockedKey);
    const storedTimestamp = getSessionData(keys.timestampKey);

    if (isStoredUnlocked && storedTimestamp) {
      const unlockAge = Date.now() - (storedTimestamp as number);
      if (unlockAge < maxUnlockAge) {
        unlockState[device] = true;
      } else {
        clearSessionData(keys.unlockedKey);
        clearSessionData(keys.timestampKey);
      }
    }
  }

  return unlockState;
};

export const UnlockProvider = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useMobileDetection();

  const [unlockState, setUnlockState] = useState<Record<string, boolean>>(
    readUnlockStateFromStorage,
  );
  const [showHackCompleteFeedback, setShowHackCompleteFeedback] =
    useState<boolean>(false);
  const unlockTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const updateUnlockState = useCallback((device: string, value: boolean) => {
    setUnlockState((prev) => {
      if (prev[device] === value) {
        return prev;
      }

      return {
        ...prev,
        [device]: value,
      };
    });
  }, []);

  const persistUnlockState = useCallback((device: string, value: boolean) => {
    const config = STORAGE_CONFIG[device];
    if (!config) {
      return;
    }

    if (value) {
      setSessionData(config.unlockedKey, true);
      setSessionData(config.timestampKey, Date.now());
    } else {
      clearSessionData(config.unlockedKey);
      clearSessionData(config.timestampKey);
    }
  }, []);

  const resetUnlockState = useCallback(() => {
    setUnlockState({ ...INITIAL_UNLOCK_STATE });
    for (const device of Object.keys(STORAGE_CONFIG)) {
      persistUnlockState(device, false);
    }
  }, [persistUnlockState]);

  const finalizeUnlock = useCallback(() => {
    updateUnlockState(DEVICE_KEYS.DEFAULT, true);

    if (isMobile) {
      updateUnlockState(DEVICE_KEYS.MOBILE, true);
    }
  }, [isMobile, updateUnlockState]);

  const completeHack = useCallback(() => {
    const devicesToPersist = [DEVICE_KEYS.DEFAULT];
    if (isMobile) {
      devicesToPersist.push(DEVICE_KEYS.MOBILE);
    }

    for (const device of devicesToPersist) {
      persistUnlockState(device, true);
    }

    setShowHackCompleteFeedback(true);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowHackCompleteFeedback(false);
      feedbackTimeoutRef.current = null;
    }, ANIMATION_TIMING.HACK_COMPLETE_FEEDBACK_DURATION);

    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
    }
    unlockTimeoutRef.current = setTimeout(() => {
      finalizeUnlock();
      unlockTimeoutRef.current = null;
    }, ANIMATION_TIMING.MATRIX_MODAL_CLOSE_DELAY);

    return true;
  }, [finalizeUnlock, isMobile, persistUnlockState]);

  const logout = useCallback(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    setShowHackCompleteFeedback(false);
    resetUnlockState();
  }, [resetUnlockState]);

  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const {
    [DEVICE_KEYS.DEFAULT]: isUnlocked,
    [DEVICE_KEYS.MOBILE]: isMobileUnlocked,
  } = unlockState;

  const toolsAccessible = useMemo(() => {
    if (isMobile) {
      return isMobileUnlocked;
    }
    return isUnlocked;
  }, [isMobile, isMobileUnlocked, isUnlocked]);

  return (
    <UnlockContext.Provider
      value={useMemo(
        () => ({
          isUnlocked,
          isMobileUnlocked,
          toolsAccessible,
          completeHack,
          showHackCompleteFeedback,
          logout,
          isMobile,
        }),
        [
          isUnlocked,
          isMobileUnlocked,
          toolsAccessible,
          completeHack,
          showHackCompleteFeedback,
          logout,
          isMobile,
        ],
      )}
    >
      {children}
    </UnlockContext.Provider>
  );
};

export const useUnlock = () => {
  const context = useContext(UnlockContext);
  if (!context) {
    throw new Error("useUnlock must be used within an UnlockProvider");
  }
  return context;
};
