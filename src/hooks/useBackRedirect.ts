import { useEffect } from "react";

/**
 * Adds beforeunload handler to show native "Leave site?" dialog
 * when user tries to close/refresh the tab. Works on both desktop and mobile.
 */
export const useBeforeUnload = () => {
  useEffect(() => {
    let hasInteracted = false;

    const markInteracted = () => {
      hasInteracted = true;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInteracted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("touchstart", markInteracted, { passive: true, once: true });
    document.addEventListener("click", markInteracted, { once: true });
    document.addEventListener("scroll", markInteracted, { passive: true, once: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("touchstart", markInteracted);
      document.removeEventListener("click", markInteracted);
      document.removeEventListener("scroll", markInteracted);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};
