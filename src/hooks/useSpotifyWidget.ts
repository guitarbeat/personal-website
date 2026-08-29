import { useCallback, useEffect } from "react";

const SPOTIFY_PROFILE_URL =
  "https://spotify-github-profile.kittinanx.com/api/view.svg?uid=31skxfoaghlkljkdiluds3g3decy&redirect=true";

/**
 * Custom hook to manage Spotify widget logic, including suppressing
 * Spotify URI scheme navigation errors and handling profile click fallbacks.
 */
export function useSpotifyWidget() {
  // * Suppress Spotify scheme errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // * Suppress errors related to Spotify URI scheme handlers
      if (
        event.message?.includes("spotify:") ||
        event.message?.includes("scheme does not have a registered handler")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // * Suppress unhandled promise rejections related to Spotify
      if (
        event.reason?.message?.includes("spotify:") ||
        event.reason?.message?.includes(
          "scheme does not have a registered handler",
        )
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // * Handle Spotify widget click with error handling for missing handler
  const handleSpotifyClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // * The Spotify GitHub profile widget redirects to a spotify: URI scheme
    // * which can fail if Spotify isn't installed or the handler isn't registered.
    // * We'll open the profile URL and catch any navigation errors.
    const openSpotifyProfile = () => {
      try {
        // * Use window.open with a timeout to detect if navigation fails
        const newWindow = window.open(
          SPOTIFY_PROFILE_URL,
          "_blank",
          "noopener,noreferrer",
        );

        // * If window.open returns null (blocked) or fails, fallback to web player
        if (!newWindow || newWindow.closed) {
          throw new Error("Window blocked or failed to open");
        }

        // * Set a timeout to detect if the window was closed due to scheme error
        setTimeout(() => {
          try {
            if (newWindow.closed) {
              // * Window was closed, likely due to scheme error
              // * Fallback to web player
              window.open(
                "https://open.spotify.com/user/31skxfoaghlkljkdiluds3g3decy",
                "_blank",
                "noopener,noreferrer",
              );
            }
          } catch (_fallbackError) {
            // * Silently handle fallback errors
          }
        }, 500);
      } catch (_error) {
        // * Fallback to Spotify web player if direct link fails
        try {
          window.open(
            "https://open.spotify.com/user/31skxfoaghlkljkdiluds3g3decy",
            "_blank",
            "noopener,noreferrer",
          );
        } catch (_fallbackError) {
          // * Silently handle errors - user's popup blocker may be active
        }
      }
    };

    openSpotifyProfile();
  }, []);

  return { handleSpotifyClick };
}

export default useSpotifyWidget;
