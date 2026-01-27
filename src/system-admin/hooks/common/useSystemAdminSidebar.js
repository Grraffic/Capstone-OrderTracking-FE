import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useSystemAdminSidebar Hook
 *
 * Manages the sidebar open/closed state for System Admin pages.
 * Auto-closes sidebar when switching to mobile viewport (same as property custodian).
 * User can still manually open/close sidebar on mobile via toggle button.
 *
 * @returns {Object} - { sidebarOpen, toggleSidebar }
 */
export const useSystemAdminSidebar = () => {
  const MOBILE_BREAKPOINT = 1024; // px (matches Tailwind's lg breakpoint)

  // Sidebar starts closed on all screen sizes (same as property custodian)
  // User must click menu button to open it
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevWidthRef = useRef(
    typeof window !== "undefined" ? window.innerWidth : MOBILE_BREAKPOINT
  );

  // Initialize previous width on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      prevWidthRef.current = window.innerWidth;
    }
  }, []); // Only run on mount

  // Handle resize - auto-close when switching to mobile/tablet view
  // This matches property custodian behavior: auto-closes on viewport change
  // but user can still manually open it on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const currentWidth = window.innerWidth;
        const isMobile = currentWidth < MOBILE_BREAKPOINT;

        // Auto-close if switching to mobile/tablet and sidebar is open
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




