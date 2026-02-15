import { useEffect, useRef, useCallback } from "react";

/**
 * Intercepts browser back button/gesture (including mobile swipe-back)
 * and tab/app switching on mobile. Calls `onBack` instead of leaving.
 */
export const useBackRedirect = (onBack: () => void) => {
  const triggered = useRef(false);
  const hasInteracted = useRef(false);

  const triggerOnce = useCallback(() => {
    if (!triggered.current && hasInteracted.current) {
      triggered.current = true;
      onBack();
      // Push state again to keep intercepting
      window.history.pushState({ backRedirect: true }, "");
      setTimeout(() => {
        triggered.current = false;
      }, 1500);
    }
  }, [onBack]);

  useEffect(() => {
    // Push multiple entries for more robust mobile interception
    window.history.pushState({ backRedirect: true }, "");
    window.history.pushState({ backRedirect: true }, "");

    // Track user interaction so we don't fire on initial load
    const markInteracted = () => {
      hasInteracted.current = true;
    };

    // popstate: handles back button + mobile swipe-back gestures
    const handlePopState = () => {
      triggerOnce();
    };

    // beforeunload: shows native "Leave site?" on desktop tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInteracted.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    // visibilitychange: detect mobile app/tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasInteracted.current) {
        // When user returns, they'll see the promo
        triggered.current = false;
      }
    };

    // touchstart ensures mobile interaction is tracked
    document.addEventListener("touchstart", markInteracted, { passive: true, once: true });
    document.addEventListener("click", markInteracted, { once: true });
    document.addEventListener("scroll", markInteracted, { passive: true, once: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("touchstart", markInteracted);
      document.removeEventListener("click", markInteracted);
      document.removeEventListener("scroll", markInteracted);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [triggerOnce]);
};
