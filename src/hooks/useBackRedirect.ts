import { useEffect, useRef } from "react";

/**
 * Intercepts browser back button by pushing an extra history state.
 * Calls `onBack` when user presses back instead of leaving.
 */
export const useBackRedirect = (onBack: () => void) => {
  const triggered = useRef(false);

  useEffect(() => {
    // Push an extra entry so pressing back stays on our page
    window.history.pushState({ backRedirect: true }, "");

    const handlePopState = (e: PopStateEvent) => {
      if (!triggered.current) {
        triggered.current = true;
        onBack();
        // Push again so they can't leave on second press either
        window.history.pushState({ backRedirect: true }, "");
        // Reset after a delay so it can trigger again
        setTimeout(() => {
          triggered.current = false;
        }, 1000);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onBack]);
};
