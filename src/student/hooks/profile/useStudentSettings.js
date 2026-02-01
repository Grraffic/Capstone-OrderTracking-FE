import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authAPI } from "../../../services/api";
import { profileService } from "../../../services/profile.service";
import {
  isValidStudentNumber,
  normalizeStudentNumber,
  getStudentTypeFromStudentNumber,
} from "../../../utils/studentNumberFormat";
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

  // Editable form fields - Name comes from Google account (read-only in UI)
  const [formData, setFormData] = useState({
    courseYearLevel: "", // Combined field (e.g., "BSIS 1st Year", "Grade 10")
    studentNumber: "",
    gender: "",
    studentType: "", // "new" or "old" - used for max-order-per-item segment
  });

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    gender: null,
    studentNumber: null,
    courseYearLevel: null,
    studentType: null,
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.getProfile();
      const userData = response.data;

      const rawStudentType = userData.studentType ?? userData.student_type ?? user?.studentType ?? user?.student_type ?? "";
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
        gender: userData.gender || user?.gender || "",
        studentType: rawStudentType,
        onboardingCompleted:
          userData.onboardingCompleted ?? userData.onboarding_completed ?? false,
        onboardingCompletedAt:
          userData.onboardingCompletedAt ?? userData.onboarding_completed_at ?? null,
      };

      setProfileData(profile);
      setImagePreview(profile.photoURL);
      setOriginalImageUrl(profile.photoURL);

      // Initialize form data (name is read-only from Google, not in form)
      // Normalize courseYearLevel to match dropdown option format
      const rawCourseYearLevel = profile.courseYearLevel !== "N/A" ? profile.courseYearLevel : "";
      const normalizedCourseYearLevel = normalizeCourseYearLevel(rawCourseYearLevel);

      setFormData({
        courseYearLevel: normalizedCourseYearLevel,
        studentNumber:
          profile.studentNumber !== "N/A" ? profile.studentNumber : "",
        gender: profile.gender || "",
        studentType: (rawStudentType || "").toLowerCase() || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.details;
      setError(serverMessage || err.message || "Failed to load profile data");

      if (user) {
        const fallbackProfile = {
          id: user.id,
          name: user.displayName || user.name || user.email?.split("@")[0] || "Student",
          email: user.email || "",
          photoURL: user.photoURL || null,
          role: user.role || "student",
          studentNumber: "N/A",
          courseYearLevel: "N/A",
          gender: "",
          studentType: "",
        };
        setProfileData(fallbackProfile);
        setImagePreview(fallbackProfile.photoURL);
        setFormData({
          courseYearLevel: "",
          studentNumber: "",
          gender: "",
          studentType: "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Auto-detect student type from student number in real-time
  useEffect(() => {
    if (!formData.studentNumber || !formData.studentNumber.trim()) {
      // Clear student type if student number is cleared
      if (formData.studentType) {
        setFormData((prev) => ({
          ...prev,
          studentType: "",
        }));
        setHasChanges(true);
      }
      return;
    }

    const detectedType = getStudentTypeFromStudentNumber(formData.studentNumber);
    if (detectedType) {
      // Auto-set student type in real-time
      setFormData((prev) => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.studentType !== detectedType) {
          setHasChanges(true);
          return {
            ...prev,
            studentType: detectedType,
          };
        }
        return prev;
      });
    } else if (formData.studentType) {
      // Clear if student number becomes invalid
      setFormData((prev) => ({
        ...prev,
        studentType: "",
      }));
      setHasChanges(true);
    }
  }, [formData.studentNumber]);

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
    // Clear field error when user starts typing/selecting
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  /**
   * Normalize course year level from database format to dropdown format
   * Converts variations like "BSIS 4th year" or "BSIS 4th yr" to "BSIS 4th Year"
   * @param {string} courseYearLevel - Course year level from database
   * @returns {string} Normalized course year level matching dropdown options
   */
  const normalizeCourseYearLevel = (courseYearLevel) => {
    if (!courseYearLevel || typeof courseYearLevel !== "string") {
      return "";
    }

    const trimmed = courseYearLevel.trim();
    if (!trimmed) return "";

    // Handle college course formats: "BSIS 4th year" → "BSIS 4th Year"
    // Pattern matches: (Course Code) (Number)(st|nd|rd|th) (year|yr|Year)
    const collegePattern = /^(BSIS|BSA|BSAIS|BSSW|BAB|ACT)\s+(\d+)(st|nd|rd|th)\s+(year|yr|Year)$/i;
    const match = trimmed.match(collegePattern);

    if (match) {
      const courseCode = match[1].toUpperCase();
      const yearNumber = match[2];
      const yearSuffix = match[3];
      // Always capitalize "Year"
      return `${courseCode} ${yearNumber}${yearSuffix} Year`;
    }

    // For other formats (Grade 10, Kindergarten, etc.), return as-is
    return trimmed;
  };

  /**
   * Map course & year level to education level
   * Updated mapping for new combined format
   */
  const getEducationLevel = (courseYearLevel) => {
    if (!courseYearLevel) return null;

    // Preschool: Prekindergarten and Kindergarten (Kinder kept for backward compatibility)
    if (courseYearLevel === "Prekindergarten" || courseYearLevel === "Kindergarten" || courseYearLevel === "Kinder") {
      return "Kindergarten";
    }

    // Elementary (Grades 1-6)
    if (courseYearLevel.match(/^Grade [1-6]$/)) {
      return "Elementary";
    }

    // Junior High School (Grades 7-10)
    if (courseYearLevel.match(/^Grade (7|8|9|10)$/)) {
      return "Junior High School";
    }

    // Senior High School (Grades 11-12)
    if (courseYearLevel.match(/^Grade (11|12)$/)) {
      return "Senior High School";
    }

    // College Programs (BSIS, BSA, BSAIS, BSSW, BAB, ACT)
    if (
      courseYearLevel.match(
        /^(BSIS|BSA|BSAIS|BSSW|BAB|ACT) (1st|2nd|3rd|4th) Year$/
      )
    ) {
      return "College";
    }

    return null;
  };

  /**
   * Save changes to backend
   */
  const handleSaveChanges = useCallback(async () => {
    try {
      setSaving(true);

      // Validate required fields for onboarding
      const newFieldErrors = {};
      let hasErrors = false;

      if (!formData.gender) {
        newFieldErrors.gender = "Gender is required";
        hasErrors = true;
      }
      if (!formData.studentNumber || !String(formData.studentNumber).trim()) {
        newFieldErrors.studentNumber = "Student number is required";
        hasErrors = true;
      } else {
        const normalizedStudentNumber = normalizeStudentNumber(formData.studentNumber);
        if (!isValidStudentNumber(normalizedStudentNumber)) {
          newFieldErrors.studentNumber = "Student number must match format: YY-NNNNNIII (e.g. 22-00023RSR)";
          hasErrors = true;
        }
      }
      if (!formData.courseYearLevel) {
        newFieldErrors.courseYearLevel = "Course & Year Level is required";
        hasErrors = true;
      }
      if (!formData.studentType || !String(formData.studentType).trim()) {
        newFieldErrors.studentType = "Student type is required";
        hasErrors = true;
      }

      if (hasErrors) {
        setFieldErrors(newFieldErrors);
        setSaving(false);
        return;
      }

      // Clear any existing errors if validation passes
      setFieldErrors({
        gender: null,
        studentNumber: null,
        courseYearLevel: null,
        studentType: null,
      });

      // Calculate education level from course & year level
      const educationLevel = getEducationLevel(formData.courseYearLevel);

      // Name is read-only from Google; do not overwrite it from this form
      const updateData = {
        courseYearLevel: formData.courseYearLevel,
        studentNumber: normalizedStudentNumber || formData.studentNumber || null,
        gender: formData.gender || null,
        educationLevel: educationLevel,
        studentType: formData.studentType && formData.studentType.trim() ? formData.studentType.trim().toLowerCase() : null,
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
      const res = await authAPI.updateProfile(updateData);
      const updated = res?.data;

      // Update local state
      setOriginalImageUrl(imageUrl);
      setImageFile(null);
      setHasChanges(false);

      // Update auth context with returned profile (including gender, studentType) so it persists in session
      if (updateUser) {
        const onboardingCompleted =
          updated?.onboardingCompleted ?? updated?.onboarding_completed ?? null;
        const onboardingCompletedAt =
          updated?.onboardingCompletedAt ?? updated?.onboarding_completed_at ?? null;
        updateUser({
          ...user,
          photoURL: imageUrl ?? user?.photoURL,
          gender: updated?.gender ?? user?.gender,
          educationLevel: updated?.educationLevel ?? user?.educationLevel,
          studentType: updated?.studentType ?? user?.studentType ?? null,
          onboardingCompleted: onboardingCompleted ?? user?.onboardingCompleted ?? null,
          onboardingCompletedAt: onboardingCompletedAt ?? user?.onboardingCompletedAt ?? null,
        });
      }

      // Sync form/profile from response so saved gender and studentType show immediately
      if (updated) {
        setProfileData((prev) => (prev ? { ...prev, gender: updated.gender ?? prev.gender, studentType: updated.studentType ?? prev.studentType } : prev));
        setFormData((prev) => ({ ...prev, gender: updated.gender ?? prev.gender ?? "", studentType: (updated.studentType ?? prev.studentType ?? "").toLowerCase() }));
      }

      toast.success("Profile updated successfully!");

      // Refresh profile data from server
      await fetchProfileData();

      // Navigate after successful save:
      // - If onboarding just became complete, go to products page
      // - Otherwise, go to student profile
      setTimeout(() => {
        const wasCompleted = user?.onboardingCompleted === true;
        const nowCompleted =
          (updated?.onboardingCompleted ?? updated?.onboarding_completed) === true;
        navigate(!wasCompleted && nowCompleted ? "/all-products" : "/student/profile");
      }, 1000); // Small delay to show success toast
    } catch (err) {
      console.error("Error saving changes:", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.details;
      const message = serverMessage || err.message || "Failed to save changes";
      toast.error(message);
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

    // Reset form data to original profile values (name is read-only from Google)
    // Normalize courseYearLevel to match dropdown option format
    const rawCourseYearLevel = profileData?.courseYearLevel !== "N/A"
      ? profileData?.courseYearLevel
      : "";
    const normalizedCourseYearLevel = normalizeCourseYearLevel(rawCourseYearLevel);

    setFormData({
      courseYearLevel: normalizedCourseYearLevel,
      studentNumber:
        profileData?.studentNumber !== "N/A" ? profileData?.studentNumber : "",
      gender: profileData?.gender || "",
      studentType: (profileData?.studentType || "").toLowerCase() || "",
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
    fieldErrors,
    handleImageSelect,
    handleRemovePhoto,
    handleFieldChange,
    handleSaveChanges,
    handleDiscardChanges,
    refetch: fetchProfileData,
  };
};
