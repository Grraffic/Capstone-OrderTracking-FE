import React, { createContext, useContext, useEffect, useState } from "react";
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

  // User roles for school uniform ordering system
  // - STUDENT: Students ordering uniforms (@student.laverdad.edu.ph)
  // - PROPERTY_CUSTODIAN: Property custodians managing inventory (@laverdad.edu.ph)
  // - SYSTEM_ADMIN: System administrators managing users and settings
  const USER_ROLES = {
    STUDENT: "student",
    PROPERTY_CUSTODIAN: "property_custodian",
    SYSTEM_ADMIN: "system_admin",
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          const response = await authAPI.getProfile();
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
          console.log("🔍 AuthContext - Received profile data from API:", {
            photoURL: userData.photoURL,
            photo_url: userData.photo_url,
            avatar_url: userData.avatar_url,
            fullUserData: userData,
          });

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
          };

          console.log("✅ AuthContext - Normalized user object:", {
            photoURL: normalized.photoURL,
            displayName: normalized.displayName,
          });

          // If no photo URL exists, try to refresh it (for existing users who logged in before the fix)
          if (!normalized.photoURL) {
            console.log("No profile picture found, attempting to refresh...");
            try {
              const refreshResponse = await authAPI.refreshProfilePicture();
              if (refreshResponse.data?.photoURL) {
                normalized.photoURL = refreshResponse.data.photoURL;
                console.log("Profile picture refreshed:", normalized.photoURL);
              }
            } catch (refreshError) {
              console.warn("Failed to refresh profile picture:", refreshError);
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
        console.error("Error checking auth status:", error);
        
        // Check if error is due to inactive account
        if (error.response?.status === 403 && error.response?.data?.error === "account_inactive") {
          console.log("🚫 Account is inactive, clearing session...");
          localStorage.removeItem("authToken");
          setUser(null);
          setUserRole(null);
          setLoading(false);
          // Don't redirect here - let ProtectedRoute handle it
          return;
        }
        
        // If token is invalid, clear it
        localStorage.removeItem("authToken");
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
      window.location.href = `${baseUrl}/auth/google`;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem("authToken");
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

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
    signInWithGoogle,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
