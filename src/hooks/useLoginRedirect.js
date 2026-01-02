/**
 * useLoginRedirect Hook
 *
 * Handles post-login redirect logic:
 * - Determines redirect route based on user role/email domain
 * - Handles redirect to previous page if available
 * - Manages redirect side effects
 *
 * Usage:
 * useLoginRedirect(user);
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Determines the default route based on user role
 * @param {Object} user - User object with role property (from backend)
 * @returns {string} - Route path
 */
const getDefaultRoute = (user) => {
  if (!user) {
    return "/";
  }

  // Use role from backend (single source of truth)
  // Backend determines role based on email domain and admin config
  if (user.role === "system_admin") {
    return "/system-admin";
  } else if (user.role === "property_custodian" || user.role === "admin") {
    // Handle both new and old role names for backward compatibility
    return "/property-custodian";
  } else if (user.role === "student") {
    return "/all-products";
  }

  // Default fallback
  return "/";
};

export const useLoginRedirect = (user) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Get the page user was trying to access before login
      const from = location.state?.from?.pathname || getDefaultRoute(user);

      console.log(`Redirecting user to: ${from}`);
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return { getDefaultRoute };
};
