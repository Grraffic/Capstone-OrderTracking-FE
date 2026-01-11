import { useState, useEffect } from "react";

/**
 * useSystemAdminSidebar Hook
 *
 * Manages the sidebar open/closed state for System Admin pages.
 * Persists state in localStorage and provides toggle functionality.
 *
 * @returns {Object} - { sidebarOpen, toggleSidebar }
 */
export const useSystemAdminSidebar = () => {
  const STORAGE_KEY = "system_admin_sidebar_open";

  // Initialize state from localStorage or default to true
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch (error) {
      console.error("Error reading sidebar state from localStorage:", error);
      return true; // Default to open
    }
  });

  // Save to localStorage whenever sidebarOpen changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarOpen));
    } catch (error) {
      console.error("Error saving sidebar state to localStorage:", error);
    }
  }, [sidebarOpen]);

  // Toggle sidebar state
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return {
    sidebarOpen,
    toggleSidebar,
  };
};




