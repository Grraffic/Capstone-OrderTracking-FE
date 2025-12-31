import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useAdminSidebar Hook
 *
 * Manages admin sidebar state and toggle functionality:
 * - Sidebar open/close state
 * - Toggle function to switch between open and closed states
 * - Sidebar starts closed on all screen sizes (desktop and mobile)
 * - User must click menu button to open it
 * - When open, shows full sidebar with labels (w-64) on all screen sizes
 * - When closed, shows icons only (w-20)
 *
 * @returns {Object} Object containing sidebarOpen state and toggleSidebar function
 *
 * Usage:
 * const { sidebarOpen, toggleSidebar } = useAdminSidebar();
 */
export const useAdminSidebar = () => {
  const MOBILE_BREAKPOINT = 1024; // px (matches Tailwind's lg breakpoint)

  // Sidebar starts closed on all screen sizes (desktop and mobile)
  // User must click menu button to open it
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevWidthRef = useRef(
    typeof window !== "undefined" ? window.innerWidth : MOBILE_BREAKPOINT
  );

  // Initialize previous width on mount
  // Sidebar already starts closed (initialized to false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      prevWidthRef.current = window.innerWidth;
    }
  }, []); // Only run on mount

  // Handle resize - auto-close when on mobile/tablet view
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const currentWidth = window.innerWidth;
        const isMobile = currentWidth < MOBILE_BREAKPOINT;

        // Auto-close if on mobile/tablet and sidebar is open
        if (isMobile && sidebarOpen) {
          setSidebarOpen(false);
        }

        // Update previous width
        prevWidthRef.current = currentWidth;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]); // Include sidebarOpen to check current state

  // Allow manual toggle - user can open sidebar even on mobile
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
  };
};
