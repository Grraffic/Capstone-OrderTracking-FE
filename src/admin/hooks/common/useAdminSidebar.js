import { useState, useCallback, useEffect } from "react";

/**
 * useAdminSidebar Hook
 *
 * Manages admin sidebar state and toggle functionality:
 * - Sidebar open/close state
 * - Toggle function to switch between open and closed states
 * - Auto-collapses sidebar on mobile screens
 *
 * @param {boolean} initialState - Initial sidebar state (default: true)
 * @returns {Object} Object containing sidebarOpen state and toggleSidebar function
 *
 * Usage:
 * const { sidebarOpen, toggleSidebar } = useAdminSidebar();
 */
export const useAdminSidebar = (initialState = true) => {
  const [sidebarOpen, setSidebarOpen] = useState(initialState);

  // Auto-collapse sidebar on mobile-sized viewports
  useEffect(() => {
    const MOBILE_BREAKPOINT = 1024; // px (matches Tailwind's lg breakpoint)

    const handleResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setSidebarOpen(false);
      }
    };

    // Run once on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
  };
};

