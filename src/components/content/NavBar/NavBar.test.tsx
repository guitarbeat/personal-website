import type React from "react";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  }),
  { virtual: true },
); // Adding virtual: true might help if the module doesn't exist yet or is virtualized

jest.mock("../../../hooks/useVFXEffect", () => ({
  useVFXEffect: () => ({ isReady: true }),
}));

jest.mock("../../../utils/commonUtils", () => ({
  cn: (...args: unknown[]) => args.join(" "),
  debounce: (fn: unknown) => fn,
}));

jest.mock("../../effects/Matrix/AuthContext", () => ({
  useAuth: () => ({ isUnlocked: true }),
}));

import { getInitialTheme, THEME } from "./NavBar";

describe("NavBar - getInitialTheme", () => {
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    originalWindow = global.window;
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      writable: true,
    });
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  it("returns true when theme in localStorage is light", () => {
    const mockGetItem = jest.fn().mockReturnValue(THEME.LIGHT);
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem },
      writable: true,
    });

    expect(getInitialTheme()).toBe(true);
    expect(mockGetItem).toHaveBeenCalledWith(THEME.STORAGE_KEY);
  });

  it("returns false when theme in localStorage is dark", () => {
    const mockGetItem = jest.fn().mockReturnValue(THEME.DARK);
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem },
      writable: true,
    });

    expect(getInitialTheme()).toBe(false);
    expect(mockGetItem).toHaveBeenCalledWith(THEME.STORAGE_KEY);
  });

  it("handles localStorage throwing an error and falls back to matchMedia", () => {
    const mockGetItem = jest.fn().mockImplementation(() => {
      throw new Error("Storage is disabled");
    });
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem },
      writable: true,
    });

    const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    // Should swallow the error and fall back to matchMedia
    expect(getInitialTheme()).toBe(true);
    expect(mockGetItem).toHaveBeenCalledWith(THEME.STORAGE_KEY);
    expect(mockMatchMedia).toHaveBeenCalledWith(
      "(prefers-color-scheme: light)",
    );
  });

  it("handles localStorage throwing an error and falls back to default if matchMedia is unavailable", () => {
    const mockGetItem = jest.fn().mockImplementation(() => {
      throw new Error("Storage is disabled");
    });
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem },
      writable: true,
    });

    Object.defineProperty(window, "matchMedia", {
      value: undefined,
      writable: true,
    });

    expect(getInitialTheme()).toBe(false);
  });
});
