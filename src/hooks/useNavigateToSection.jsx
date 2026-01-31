import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useNavigateToSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToSection = useCallback(
    (id) => {
      if (location.pathname === "/" || location.pathname === "") {
        const el = document.getElementById(id);
        if (el) {
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
          return;
        }
      }

      // Navigate to landing page and instruct it to scroll after mount
      navigate("/", { state: { scrollTo: id } });
    },
    [location, navigate]
  );

  return navigateToSection;
}
