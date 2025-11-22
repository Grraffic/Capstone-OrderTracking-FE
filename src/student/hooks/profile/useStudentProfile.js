import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { authAPI } from "../../../services/api";

/**
 * useStudentProfile Hook
 *
 * Manages student profile data fetching and state:
 * - Fetches student profile information from auth context
 * - Handles loading and error states
 * - Provides profile data including name, email, student number, course, year level
 *
 * @returns {Object} Profile state and data
 */
export const useStudentProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get profile data from auth API
      const response = await authAPI.getProfile();
      const userData = response.data;

      // Transform and normalize profile data
      const profile = {
        id: userData.id || user?.id,
        name: userData.name || user?.displayName || user?.name || "Student",
        email: userData.email || user?.email || "",
        photoURL: userData.photoURL || userData.photo_url || user?.photoURL || null,
        role: userData.role || user?.role || "student",
        // Additional fields that might come from backend
        studentNumber: userData.studentNumber || userData.student_number || "N/A",
        course: userData.course || "N/A",
        yearLevel: userData.yearLevel || userData.year_level || "N/A",
      };

      setProfileData(profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile data");
      
      // Fallback to user context data if API fails
      if (user) {
        setProfileData({
          id: user.id,
          name: user.displayName || user.name || "Student",
          email: user.email || "",
          photoURL: user.photoURL || null,
          role: user.role || "student",
          studentNumber: "N/A",
          course: "N/A",
          yearLevel: "N/A",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchProfileData();
  };

  return {
    profileData,
    loading,
    error,
    refetch,
  };
};

