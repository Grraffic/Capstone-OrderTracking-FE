import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollOnState() {
  const location = useLocation();

  useEffect(() => {
    if (location && location.state && location.state.scrollTo) {
      const id = location.state.scrollTo;
      const el = document.getElementById(id);
      if (el) {
        // Small timeout to allow mount
        setTimeout(() => {
          // For "about" section, adjust scroll to show both text and background image
          if (id === "about") {
            const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
            const headerHeight = 100; // Account for fixed header
            const viewportHeight = window.innerHeight;
            // Calculate scroll position to show About section in upper portion, leaving room for background image below
            const scrollPosition = elementTop - headerHeight - (viewportHeight * 0.1);
            window.scrollTo({
              top: Math.max(0, scrollPosition),
              behavior: "smooth",
            });
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 50);
      }
    }
  }, [location]);
}
