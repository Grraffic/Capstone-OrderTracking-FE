import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  // Session timeout: 1 hour in milliseconds
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // User roles: student (students table) and staff roles (staff table)
  const USER_ROLES = {
    STUDENT: "student",
    SYSTEM_ADMIN: "system_admin",
    PROPERTY_CUSTODIAN: "property_custodian",
    FINANCE_STAFF: "finance_staff",
    ACCOUNTING_STAFF: "accounting_staff",
    DEPARTMENT_HEAD: "department_head",
  };
  const STAFF_ROLES = [
    USER_ROLES.SYSTEM_ADMIN,
    USER_ROLES.PROPERTY_CUSTODIAN,
    USER_ROLES.FINANCE_STAFF,
    USER_ROLES.ACCOUNTING_STAFF,
    USER_ROLES.DEPARTMENT_HEAD,
  ];

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // If we landed with token in URL (OAuth callback), store it first so we don't
        // miss it (AuthCallback runs after this effect; reading URL here avoids "login twice").
        let urlParams;
        try {
          urlParams = new URLSearchParams(window.location.search);
        } catch (urlError) {
          // console.error("Error parsing URL parameters:", urlError);
          urlParams = new URLSearchParams();
        }
        
        const tokenFromUrl = urlParams.get("token");
        if (tokenFromUrl) {
          try {
            localStorage.setItem("authToken", tokenFromUrl);
          } catch (storageError) {
            // console.error("Error storing token in localStorage:", storageError);
            // Continue without storing - might be in private browsing mode
          }
        }

        let storedToken;
        try {
          storedToken = localStorage.getItem("authToken");
        } catch (storageError) {
          // console.error("Error reading from localStorage:", storageError);
          storedToken = null;
        }

        if (storedToken) {
          let response;
          try {
            response = await authAPI.getProfile();
          } catch (apiError) {
            // console.error("Error fetching user profile:", apiError);
            // Check if it's a network error (common on iOS)
            if (!apiError.response) {
              // console.error("Network error - API may be unreachable");
              // Set loading to false but don't clear token - might be temporary network issue
              setLoading(false);
              return;
            }
            throw apiError; // Re-throw to be caught by outer catch
          }
          
          if (!response || !response.data) {
            // console.error("Invalid response from getProfile API");
            setLoading(false);
            return;
          }
          
          const userData = response.data;
          // Normalize profile shape for frontend components
          // Extract email safely - handle both string and object cases
          let emailString = "";
          if (typeof userData.email === "string") {
            emailString = userData.email;
          } else if (userData.email && typeof userData.email === "object") {
            // Try common object property names
            emailString = userData.email.email || userData.email.value || "";
          }

          // Debug logging to see what we're receiving from the API
          // console.log("🔍 AuthContext - Received profile data from API:", {
          //   photoURL: userData.photoURL,
          //   photo_url: userData.photo_url,
          //   avatar_url: userData.avatar_url,
          //   fullUserData: userData,
          // });

          const normalized = {
            id: userData.id,
            uid: userData.id, // Compatibility alias for components expecting uid
            email: emailString,
            role: userData.role,
            displayName:
              userData.name || (emailString ? emailString.split("@")[0] : ""),
            // Try multiple possible fields for profile photo from backend/Supabase
            photoURL:
              userData.photoURL ||
              userData.photo_url ||
              userData.avatar_url ||
              userData.picture ||
              userData.image ||
              null,
            // Include profile fields used by student limits and settings
            gender: userData.gender ?? null,
            educationLevel: userData.educationLevel ?? userData.education_level ?? null,
            studentType: userData.studentType ?? userData.student_type ?? null,
            onboardingCompleted:
              userData.onboardingCompleted === true || userData.onboarding_completed === true
                ? true
                : false,
            onboardingCompletedAt:
              userData.onboardingCompletedAt ??
              userData.onboarding_completed_at ??
              null,
            // Include is_active if provided by API (for ProtectedRoute checks)
            is_active: userData.is_active !== undefined ? userData.is_active : true,
          };

          // console.log("✅ AuthContext - Normalized user object:", {
          //   photoURL: normalized.photoURL,
          //   displayName: normalized.displayName,
          // });

          // If no photo URL exists, try to refresh it (for existing users who logged in before the fix)
          if (!normalized.photoURL) {
            // console.log("No profile picture found, attempting to refresh...");
            try {
              const refreshResponse = await authAPI.refreshProfilePicture();
              if (refreshResponse.data?.photoURL) {
                normalized.photoURL = refreshResponse.data.photoURL;
                // console.log("Profile picture refreshed:", normalized.photoURL);
              }
            } catch (refreshError) {
              // console.warn("Failed to refresh profile picture:", refreshError);
              // Continue without photo - will use initials fallback in UI
            }
          }

          setUser(normalized);
          // Use role from backend (single source of truth)
          // Backend determines role based on email domain and admin config
          const role = userData.role || "student"; // Fallback to student if role not provided
          setUserRole(role);
        }
      } catch (error) {
        // console.error("Error checking auth status:", error);
        // console.error("Error details:", {
        //   message: error.message,
        //   name: error.name,
        //   stack: error.stack,
        //   response: error.response ? {
        //     status: error.response.status,
        //     statusText: error.response.statusText,
        //     data: error.response.data
        //   } : null
        // });
        
        // Check if error is due to inactive account
        if (error.response?.status === 403 && error.response?.data?.error === "account_inactive") {
          // console.log("🚫 Account is inactive, clearing session...");
          try {
            localStorage.removeItem("authToken");
          } catch (storageError) {
            // console.error("Error clearing authToken from localStorage:", storageError);
          }
          setUser(null);
          setUserRole(null);
          setLoading(false);
          // Don't redirect here - let ProtectedRoute handle it
          return;
        }
        
        // If token is invalid or expired, clear it
        if (error.response?.status === 401 || error.response?.status === 403) {
          // console.log("Token is invalid or expired, clearing session...");
          try {
            localStorage.removeItem("authToken");
          } catch (storageError) {
            // console.error("Error clearing authToken from localStorage:", storageError);
          }
        }
        
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Note: Role determination is now handled entirely by the backend
  // The backend checks email domains and admin config, then returns the role
  // in the JWT token and profile API response. This keeps admin emails secure
  // and provides a single source of truth for role determination.

  const signInWithGoogle = async () => {
    try {
      // Redirect to backend Google OAuth endpoint using environment variable
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      if (!baseUrl) {
        throw new Error("API URL is not configured");
      }
      
      const redirectUrl = `${baseUrl}/auth/google`;
      // console.log("Redirecting to Google OAuth:", redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      // console.error("Error signing in with Google:", error);
      // console.error("Error details:", {
      //   message: error.message,
      //   name: error.name,
      //   stack: error.stack
      // });
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // console.error("Error calling logout API:", error);
      // Continue with local logout even if API call fails
    } finally {
      try {
        localStorage.removeItem("authToken");
      } catch (storageError) {
        // console.error("Error clearing authToken from localStorage:", storageError);
      }
      setUser(null);
      setUserRole(null);
      // Clear session timeout when logging out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  // Session timeout handler - logs out user after 1 hour of inactivity
  const resetSessionTimeout = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only set timeout if user is logged in
    if (user) {
      lastActivityRef.current = Date.now();
      
      // Set new timeout for 1 hour
      timeoutRef.current = setTimeout(() => {
        // console.log("⏰ Session timeout: 1 hour of inactivity reached. Logging out...");
        logout().then(() => {
          // Redirect to login page after logout
          window.location.href = "/login";
        });
      }, SESSION_TIMEOUT);
    }
  }, [user, logout]);

  // Track user activity and reset timeout
  useEffect(() => {
    if (!user) {
      // Clear timeout if user is not logged in
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initialize timeout when user logs in
    resetSessionTimeout();

    // Activity events that should reset the timeout
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Handler for user activity - resets timeout on any activity
    // Throttled to prevent excessive timeout resets (max once per 30 seconds)
    let lastResetTime = 0;
    const THROTTLE_INTERVAL = 30000; // 30 seconds
    
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if at least 30 seconds have passed since last reset
      // This prevents excessive timeout resets while still being responsive
      if (now - lastResetTime > THROTTLE_INTERVAL) {
        lastResetTime = now;
        resetSessionTimeout();
      }
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, true);
    });

    // Cleanup: remove event listeners and clear timeout
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, resetSessionTimeout]);

  const updateUser = (updatedUserData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUserData,
    }));
  };

  const hasRole = (role) => {
    return userRole === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  const value = {
    user,
    userRole,
    loading,
    USER_ROLES,
    STAFF_ROLES,
    signInWithGoogle,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
