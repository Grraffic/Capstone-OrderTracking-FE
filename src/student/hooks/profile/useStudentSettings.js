import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authAPI } from "../../../services/api";
import { profileService } from "../../../services/profile.service";
import toast from "react-hot-toast";

/**
 * useStudentSettings Hook
 *
 * Manages student settings functionality:
 * - Profile picture upload and validation
 * - Image preview before saving
 * - API calls to update profile
 * - Loading and error states
 * - Change tracking for unsaved changes
 *
 * @returns {Object} Settings state and functions
 */
export const useStudentSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Editable form fields - Combined course and year level
  const [formData, setFormData] = useState({
    courseYearLevel: "", // Combined field (e.g., "BSIS 1st Year", "Grade 10")
    studentNumber: "",
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.getProfile();
      const userData = response.data;

      const profile = {
        id: userData.id || user?.id,
        name: userData.name || user?.displayName || user?.name || "Student",
        email: userData.email || user?.email || "",
        photoURL:
          userData.photoURL || userData.photo_url || user?.photoURL || null,
        role: userData.role || user?.role || "student",
        studentNumber:
          userData.studentNumber || userData.student_number || "N/A",
        courseYearLevel:
          userData.courseYearLevel || userData.course_year_level || "N/A",
      };

      setProfileData(profile);
      setImagePreview(profile.photoURL);
      setOriginalImageUrl(profile.photoURL);

      // Initialize form data with current profile values
      setFormData({
        courseYearLevel:
          profile.courseYearLevel !== "N/A" ? profile.courseYearLevel : "",
        studentNumber:
          profile.studentNumber !== "N/A" ? profile.studentNumber : "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile data");

      if (user) {
        const fallbackProfile = {
          id: user.id,
          name: user.displayName || user.name || "Student",
          email: user.email || "",
          photoURL: user.photoURL || null,
          role: user.role || "student",
          studentNumber: "N/A",
          course: "N/A",
          yearLevel: "N/A",
        };
        setProfileData(fallbackProfile);
        setImagePreview(fallbackProfile.photoURL);
        setFormData({
          course: "",
          yearLevel: "",
          studentNumber: "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  /**
   * Handle image file selection
   */
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
    setHasChanges(true);
  }, []);

  /**
   * Remove profile photo
   */
  const handleRemovePhoto = useCallback(() => {
    setImageFile(null);
    setImagePreview(originalImageUrl);
    setHasChanges(true);
  }, [originalImageUrl]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  /**
   * Map course & year level to education level
   * Updated mapping for new combined format
   */
  const getEducationLevel = (courseYearLevel) => {
    if (!courseYearLevel) return null;

    // Kindergarten
    if (courseYearLevel === "Kinder") return "Kindergarten";

    // Elementary (Grades 1-6)
    if (courseYearLevel.match(/^Grade [1-6]$/)) {
      return "Elementary";
    }

    // High School (Grades 7-10)
    if (courseYearLevel.match(/^Grade (7|8|9|10)$/)) {
      return "High School";
    }

    // Senior High School (Grades 11-12)
    if (courseYearLevel.match(/^Grade (11|12)$/)) {
      return "Senior High School";
    }

    // College Programs (BSIS, BSA, BSAIS, BSSW, BAB)
    if (
      courseYearLevel.match(
        /^(BSIS|BSA|BSAIS|BSSW|BAB) (1st|2nd|3rd|4th) Year$/
      )
    ) {
      return "College";
    }

    // Vocational (ACT)
    if (courseYearLevel.match(/^ACT (1st|2nd) Year$/)) {
      return "Vocational";
    }

    return null;
  };

  /**
   * Save changes to backend
   */
  const handleSaveChanges = useCallback(async () => {
    try {
      setSaving(true);

      // Validate course & year level is selected
      if (!formData.courseYearLevel) {
        toast.error("Please select your course & year level before saving.");
        setSaving(false);
        return;
      }

      // Calculate education level from course & year level
      const educationLevel = getEducationLevel(formData.courseYearLevel);

      // Prepare update data
      const updateData = {
        courseYearLevel: formData.courseYearLevel,
        studentNumber: formData.studentNumber || null,
        educationLevel: educationLevel,
      };

      // Upload image if changed
      let imageUrl = originalImageUrl;
      if (imageFile) {
        try {
          imageUrl = await profileService.uploadProfileImage(imageFile);
          updateData.photoURL = imageUrl;
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Failed to upload profile image");
          setSaving(false);
          return;
        }
      }

      // Update profile via API
      await authAPI.updateProfile(updateData);

      // Update local state
      setOriginalImageUrl(imageUrl);
      setImageFile(null);
      setHasChanges(false);

      // Update auth context to refresh navbar
      if (updateUser) {
        updateUser({
          ...user,
          photoURL: imageUrl,
        });
      }

      toast.success("Profile updated successfully!");

      // Refresh profile data
      await fetchProfileData();

      // Navigate to profile page after successful save
      setTimeout(() => {
        navigate("/student/profile");
      }, 1000); // Small delay to show success toast
    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [
    formData,
    imageFile,
    originalImageUrl,
    user,
    updateUser,
    fetchProfileData,
    navigate,
  ]);

  /**
   * Discard unsaved changes
   */
  const handleDiscardChanges = useCallback(() => {
    setImageFile(null);
    setImagePreview(originalImageUrl);

    // Reset form data to original profile values
    setFormData({
      courseYearLevel:
        profileData?.courseYearLevel !== "N/A"
          ? profileData?.courseYearLevel
          : "",
      studentNumber:
        profileData?.studentNumber !== "N/A" ? profileData?.studentNumber : "",
    });

    setHasChanges(false);
    toast.success("Changes discarded");
  }, [profileData, originalImageUrl]);

  return {
    profileData,
    loading,
    saving,
    error,
    imagePreview,
    hasChanges,
    formData,
    handleImageSelect,
    handleRemovePhoto,
    handleFieldChange,
    handleSaveChanges,
    handleDiscardChanges,
    refetch: fetchProfileData,
  };
};
