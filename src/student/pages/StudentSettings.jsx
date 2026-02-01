import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Camera, ArrowLeft, AlertCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import { useStudentSettings } from "../hooks";
import { useAuth } from "../../context/AuthContext";
import { getCourseBannerStyle } from "../utils/courseBanner";
import { splitDisplayName } from "../../utils/displayName";
import {
  STUDENT_NUMBER_PLACEHOLDER,
  STUDENT_NUMBER_FORMAT_HINT,
  getSuggestedInitials,
} from "../../utils/studentNumberFormat";

/**
 * StudentSettings Component
 *
 * Settings page for students to manage their profile:
 * - Edit profile picture
 * - View read-only profile information
 * - Save or discard changes
 *
 * All business logic is extracted to useStudentSettings hook.
 */
// Inline onboarding card – appears right below the field to fill; triangle points up to the field
const OnboardingStepCard = ({
  step,
  totalSteps,
  title,
  description,
  onSkip,
  onContinue,
  isLastStep = false,
}) => {
  return (
    <div className="mt-3 relative" aria-label="Onboarding guide">
      {/* Triangle pointer connecting card to the field above */}
      <div
        className="absolute -top-2 left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-orange-200"
        aria-hidden
      />
      <div className="rounded-xl border border-orange-200 bg-orange-50/80 shadow-md p-4">
        <p className="text-xs font-semibold text-[#003363] mb-1">Step {step} of {totalSteps}</p>
        <h2 className="text-base font-bold text-[#003363] mb-1">{title}</h2>
        <p className="text-sm text-gray-700 mb-4">{description}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="px-5 py-2 bg-[#003363] text-white rounded-lg hover:bg-[#002347] transition-colors font-medium text-sm"
          >
            {isLastStep ? "Finish" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const { user } = useAuth();

  // Persist onboarding dismissal in localStorage
  const getOnboardingDismissedKey = useCallback(() => {
    const userId = user?.id || user?.uid || "anonymous";
    return `onboarding_dismissed_${userId}`;
  }, [user?.id, user?.uid]);

  // Get localStorage key for onboarding step
  const getOnboardingStepKey = useCallback(() => {
    const userId = user?.id || user?.uid || "anonymous";
    return `onboarding_step_${userId}`;
  }, [user?.id, user?.uid]);

  // Initialize onboarding step from localStorage
  const [onboardingStep, setOnboardingStep] = useState(() => {
    if (typeof window === "undefined") return 1;
    const userId = user?.id || user?.uid || "anonymous";
    const key = `onboarding_step_${userId}`;
    const savedStep = localStorage.getItem(key);
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      return (step >= 1 && step <= 3) ? step : 1;
    }
    return 1;
  });

  // Initialize onboarding dismissed state - will be set from localStorage once user is available
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Helper function to update onboarding step and persist to localStorage
  const handleOnboardingStepChange = useCallback((newStep) => {
    setOnboardingStep(newStep);
    const stepKey = getOnboardingStepKey();
    localStorage.setItem(stepKey, String(newStep));
  }, [getOnboardingStepKey]);

  // Helper function to dismiss onboarding and persist to localStorage
  const handleDismissOnboarding = useCallback(() => {
    setOnboardingDismissed(true);
    const key = getOnboardingDismissedKey();
    localStorage.setItem(key, "true");
    // Clear the step from localStorage when dismissed
    const stepKey = getOnboardingStepKey();
    localStorage.removeItem(stepKey);
  }, [getOnboardingDismissedKey, getOnboardingStepKey]);

  // Fetch settings data and functions from hook
  const {
    profileData,
    loading,
    saving,
    error,
    imagePreview,
    hasChanges,
    formData,
    fieldErrors,
    handleImageSelect,
    handleFieldChange,
    handleSaveChanges,
    handleDiscardChanges,
  } = useStudentSettings();

  const isFirstTimeStudent =
    user?.role === "student" && user?.onboardingCompleted !== true;
  const isOnboardingFieldsComplete =
    Boolean(formData.gender && String(formData.gender).trim()) &&
    Boolean(formData.studentNumber && String(formData.studentNumber).trim()) &&
    Boolean(formData.courseYearLevel && String(formData.courseYearLevel).trim());
    // Student type is auto-detected from student number, not required in completion check

  // Check localStorage on mount and when user changes to restore dismissal state and step
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userId = user?.id || user?.uid;
    if (!userId) return; // Wait for user to be available
    
    // Restore dismissal state
    const dismissedKey = `onboarding_dismissed_${userId}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === "true";
    if (wasDismissed) {
      setOnboardingDismissed(true);
      return; // Don't restore step if dismissed
    }
    
    // Check if onboarding should be active (not completed, first time student)
    const isFirstTime = user?.role === "student" && user?.onboardingCompleted !== true;
    const fieldsComplete = Boolean(
      formData.gender && String(formData.gender).trim() &&
      formData.studentNumber && String(formData.studentNumber).trim() &&
      formData.courseYearLevel && String(formData.courseYearLevel).trim()
    );
    
    // Restore onboarding step (only if onboarding is still active and we haven't restored it yet)
    // Only restore if we're on step 1 (initial state) and formData has loaded
    if (isFirstTime && !fieldsComplete && onboardingStep === 1 && !loading) {
      const stepKey = `onboarding_step_${userId}`;
      const savedStep = localStorage.getItem(stepKey);
      if (savedStep) {
        const step = parseInt(savedStep, 10);
        if (step >= 1 && step <= 3) {
          setOnboardingStep(step);
        }
      }
    }
  }, [user?.id, user?.uid, user?.role, user?.onboardingCompleted, formData.gender, formData.studentNumber, formData.courseYearLevel, onboardingStep, loading]);

  // Persist dismissal to localStorage when fields are complete
  useEffect(() => {
    if (isOnboardingFieldsComplete) {
      const userId = user?.id || user?.uid;
      if (userId) {
        const key = `onboarding_dismissed_${userId}`;
        localStorage.setItem(key, "true");
        setOnboardingDismissed(true);
        // Clear the step from localStorage when completed
        const stepKey = `onboarding_step_${userId}`;
        localStorage.removeItem(stepKey);
      }
    }
  }, [isOnboardingFieldsComplete, user?.id, user?.uid]);

  const shouldShowGuide =
    isFirstTimeStudent && !onboardingDismissed && !isOnboardingFieldsComplete;

  // Check if profile is completed - if so, disable all fields (only system admin can edit)
  // Use truthy check to handle boolean true values properly
  const isProfileCompleted = Boolean(profileData?.onboardingCompleted) || Boolean(user?.onboardingCompleted);

  const ONBOARDING_STEPS = useMemo(
    () => [
      {
        id: 1,
        field: "gender",
        anchorId: "onboard-gender",
        title: "Gender",
        description: "Select your gender so we can show the right uniforms for you.",
      },
      {
        id: 2,
        field: "studentNumber",
        anchorId: "onboard-student-number",
        title: "Student Number",
        description: "Enter your student number so we can verify and track your orders.",
      },
      {
        id: 3,
        field: "courseYearLevel",
        anchorId: "onboard-course-year",
        title: "Course & Year Level",
        description: "Choose your course and year level so we can show only the uniforms you are eligible for.",
      },
      // Step 4 (Student Type) removed - auto-detected from student number
    ],
    []
  );

  // During onboarding, ALL fields should be read-only
  // Users must complete the entire onboarding process before they can edit any fields
  const isFieldEditableDuringOnboarding = (fieldName) => {
    if (isProfileCompleted) return false; // Profile completed, no editing
    if (shouldShowGuide) return false; // During onboarding, all fields are read-only
    
    // Not in onboarding and profile not completed, allow editing
    return true;
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // When the active onboarding step changes, scroll the corresponding field into view
  useEffect(() => {
    if (!shouldShowGuide) return;
    const current = ONBOARDING_STEPS.find((s) => s.id === onboardingStep);
    if (!current) return;
    scrollToId(current.anchorId);
  }, [onboardingStep, shouldShowGuide, ONBOARDING_STEPS]);

  // Auto-advance to next step when current step's field is filled
  useEffect(() => {
    if (!shouldShowGuide) return;
    const current = ONBOARDING_STEPS.find((s) => s.id === onboardingStep);
    if (!current) return;
    const value = formData[current.field];
    const filled = value != null && String(value).trim() !== "";
    if (filled && current.id < ONBOARDING_STEPS.length) {
      handleOnboardingStepChange(current.id + 1);
    }
  }, [shouldShowGuide, onboardingStep, formData.gender, formData.studentNumber, formData.courseYearLevel, ONBOARDING_STEPS, handleOnboardingStepChange]);

  // Course & Year Level options - Combined dropdown
  const courseYearLevelOptions = [
    // Preschool (Prekindergarten and Kindergarten)
    { value: "Prekindergarten", label: "Prekindergarten", category: "Preschool" },
    { value: "Kindergarten", label: "Kindergarten", category: "Preschool" },

    // Elementary (Grades 1-6)
    { value: "Grade 1", label: "Grade 1", category: "Elementary" },
    { value: "Grade 2", label: "Grade 2", category: "Elementary" },
    { value: "Grade 3", label: "Grade 3", category: "Elementary" },
    { value: "Grade 4", label: "Grade 4", category: "Elementary" },
    { value: "Grade 5", label: "Grade 5", category: "Elementary" },
    { value: "Grade 6", label: "Grade 6", category: "Elementary" },

    // Junior High School (Grades 7-10)
    { value: "Grade 7", label: "Grade 7", category: "Junior High School" },
    { value: "Grade 8", label: "Grade 8", category: "Junior High School" },
    { value: "Grade 9", label: "Grade 9", category: "Junior High School" },
    { value: "Grade 10", label: "Grade 10", category: "Junior High School" },

    // Senior High School (Grades 11-12)
    { value: "Grade 11", label: "Grade 11", category: "Senior High School" },
    { value: "Grade 12", label: "Grade 12", category: "Senior High School" },

    // College Programs – labels show full program names
    // BS in Information Systems
    { value: "BSIS 1st Year", label: "BS in Information Systems 1st Year", category: "College" },
    { value: "BSIS 2nd Year", label: "BS in Information Systems 2nd Year", category: "College" },
    { value: "BSIS 3rd Year", label: "BS in Information Systems 3rd Year", category: "College" },
    { value: "BSIS 4th Year", label: "BS in Information Systems 4th Year", category: "College" },

    // BS in Accountancy
    { value: "BSA 1st Year", label: "BS in Accountancy 1st Year", category: "College" },
    { value: "BSA 2nd Year", label: "BS in Accountancy 2nd Year", category: "College" },
    { value: "BSA 3rd Year", label: "BS in Accountancy 3rd Year", category: "College" },
    { value: "BSA 4th Year", label: "BS in Accountancy 4th Year", category: "College" },

    // BS in Accounting Information Systems
    { value: "BSAIS 1st Year", label: "BS in Accounting Information Systems 1st Year", category: "College" },
    { value: "BSAIS 2nd Year", label: "BS in Accounting Information Systems 2nd Year", category: "College" },
    { value: "BSAIS 3rd Year", label: "BS in Accounting Information Systems 3rd Year", category: "College" },
    { value: "BSAIS 4th Year", label: "BS in Accounting Information Systems 4th Year", category: "College" },

    // BS in Social Work
    { value: "BSSW 1st Year", label: "BS in Social Work 1st Year", category: "College" },
    { value: "BSSW 2nd Year", label: "BS in Social Work 2nd Year", category: "College" },
    { value: "BSSW 3rd Year", label: "BS in Social Work 3rd Year", category: "College" },
    { value: "BSSW 4th Year", label: "BS in Social Work 4th Year", category: "College" },

    // Bachelor of Arts in Broadcasting
    { value: "BAB 1st Year", label: "Bachelor of Arts in Broadcasting 1st Year", category: "College" },
    { value: "BAB 2nd Year", label: "Bachelor of Arts in Broadcasting 2nd Year", category: "College" },
    { value: "BAB 3rd Year", label: "Bachelor of Arts in Broadcasting 3rd Year", category: "College" },
    { value: "BAB 4th Year", label: "Bachelor of Arts in Broadcasting 4th Year", category: "College" },

    // College – Associate in Computer Technology
    { value: "ACT 1st Year", label: "Associate in Computer Technology 1st Year", category: "College" },
    { value: "ACT 2nd Year", label: "Associate in Computer Technology 2nd Year", category: "College" },
  ];

  // Handle back button click
  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      navigate(-1);
    }
  };

  // Handle discard confirmation
  const confirmDiscard = () => {
    handleDiscardChanges();
    setShowDiscardModal(false);
    navigate("/all-products");
  };

  // Trigger file input click - always allow profile image changes
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const courseLevel = formData.courseYearLevel || profileData?.courseYearLevel;
  const bannerStyle = getCourseBannerStyle(courseLevel);

  // Split Google account name for First/Last display (read-only fields)
  const nameParts = useMemo(
    () => splitDisplayName(profileData?.name ?? ""),
    [profileData?.name]
  );

  // Display name from Google account (read-only; used for card and avatar)
  const displayNameForCard = nameParts.displayName || profileData?.name?.trim() || "Student Name";
  const avatarInitial = (displayNameForCard.charAt(0) || "?").toUpperCase();

  // Reset image load error when a new image URL is set (e.g. after upload or refetch)
  useEffect(() => {
    setImageLoadError(false);
  }, [imagePreview]);

  // Always show a visible initial when there's no working image (handles failed load, missing URL, or broken production URL)
  const showImage = Boolean(imagePreview && imagePreview.trim() && !imageLoadError);

  const programDisplayNames = {
    BSIS: "BS in Information Systems",
    BAB: "Bachelor of Arts in Broadcasting",
    BSA: "BS in Accountancy",
    BSAIS: "BS in Accounting Information Systems",
    BSSW: "BS in Social Work",
    ACT: "Associate in Computer Technology",
  };
  const getProgramAndYear = (courseYearLevel) => {
    if (!courseYearLevel) return { program: "", year: "" };
    const s = String(courseYearLevel).trim();
    const match = s.match(/^(BSIS|BAB|BSAIS|BSA|BSSW|ACT)\s+(.+)$/i);
    if (!match) return { program: s, year: "" };
    const [, code, yearPart] = match;
    const program = programDisplayNames[code.toUpperCase()] || code;
    const year = yearPart ? `${yearPart.replace(/\s*year$/i, "").trim()} year` : "";
    return { program, year };
  };
  const { program: programLabel, year: yearLabel } = getProgramAndYear(courseLevel);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Main Content - No hero; compact header */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Main Container */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md p-6 md:p-8 lg:p-10">
          {/* Back Button – circular icon-only */}
          <button
            onClick={handleBack}
            type="button"
            className="mb-6 flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-[#003363] text-[#003363] shadow-md hover:bg-gray-50 hover:border-[#002347] hover:text-[#002347] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-[#003363]">User </span>
              <span className="text-[#E68B00]">Settings</span>
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003363]"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Failed to load settings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
              {/* Left Side – Student profile card: responsive mobile → tablet → laptop */}
              <div className="md:col-span-1 lg:col-span-1 flex flex-col min-h-0">
                <div className="relative bg-white rounded-2xl border-2 sm:border-4 border-gray-200 shadow-sm overflow-visible p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center h-full">
                  {/* Profile image + banner: banner anchored to image, scales with viewport */}
                  <div className="flex justify-center">
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48">
                      {/* Banner – on mobile: less in the border (right/down); desktop: left -17px, top -19px */}
                      {bannerStyle.label && (
                        <div
                          className={`absolute left-[-16px] top-[-18px] md:top-[-27px] lg:left-[-17px] lg:top-[-29px] z-10 w-11 h-[139px] flex flex-col items-center justify-center gap-2 py-4 shadow-xl origin-top-left
                            scale-[0.75] sm:scale-[0.833] md:scale-[0.917] lg:scale-100
                            ${bannerStyle.bg} ${bannerStyle.text}`}
                        >
                          <img
                            src={bannerStyle.logo || "/assets/image/LV Logo.png"}
                            alt={bannerStyle.label}
                            className="w-10 h-10 object-contain shrink-0"
                          />
                          {bannerStyle.label === "Kindergarten" ? (
                            <span className="font-bold tracking-wide text-center leading-tight text-[10px] flex flex-col items-center gap-0">
                              <span>Kinder</span>
                              <span>garten</span>
                            </span>
                          ) : bannerStyle.label === "Prekindergarten" ? (
                            <span className="font-bold tracking-wide text-center leading-tight text-[10px] flex flex-col items-center gap-0">
                              <span>Pre-</span>
                              <span>Kinder</span>
                            </span>
                          ) : (
                            <span
                              className={`font-bold tracking-wide text-center leading-tight ${
                                bannerStyle.label === "Kinder" ? "text-[10px]" : "text-xs"
                              }`}
                            >
                              {bannerStyle.label}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-[#E68B00] shadow-xl">
                        {showImage ? (
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => setImageLoadError(true)}
                          />
                        ) : (
                          <div
                            className="absolute inset-0 min-w-full min-h-full bg-[#003363] flex items-center justify-center"
                            role="img"
                            aria-label={displayNameForCard ? `Profile for ${displayNameForCard}` : "Profile picture"}
                          >
                            <span className="text-4xl sm:text-5xl font-bold text-white select-none" aria-hidden>
                              {avatarInitial}
                            </span>
                          </div>
                        )}
                        {/* Edit icon button - bottom right, always visible to allow profile image changes */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerFileInput();
                          }}
                          className="absolute bottom-2 right-2 w-10 h-10 bg-[#E68B00] rounded-full flex items-center justify-center shadow-lg hover:bg-[#d97a1f] transition-colors cursor-pointer z-10"
                          title="Change profile picture"
                          aria-label="Change profile picture"
                        >
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Student details: responsive typography */}
                  <div className="mt-4 mb-4 sm:mt-5 sm:mb-5 md:mt-5 md:mb-6 text-center">
                    <p className="font-bold text-[#003363] text-base sm:text-lg">
                      {displayNameForCard}
                    </p>
                    {programLabel && (
                      <p className="text-[#E68B00] text-xs sm:text-sm font-medium mt-0.5">
                        {programLabel}
                      </p>
                    )}
                    {yearLabel && (
                      <p className="text-[#E68B00] text-xs sm:text-sm font-medium">
                        {yearLabel}
                      </p>
                    )}
                  </div>

                  {/* Personal Information button: responsive padding & alignment */}
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("personal-information")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="mt-auto -ml-4 sm:-ml-5 md:-ml-6 mb-4 sm:mb-5 md:mb-6 w-full max-w-[280px] sm:max-w-xs pl-4 sm:pl-5 md:pl-6 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-[#003363] text-white flex items-center justify-center gap-2 font-medium hover:bg-[#002347] transition-colors shadow-sm rounded-tr-xl sm:rounded-tr-2xl rounded-br-xl sm:rounded-br-2xl self-start text-sm sm:text-base"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-white" />
                    <span className="text-white">Personal Information</span>
                  </button>

                </div>
              </div>

              {/* Right Side - Personal Information */}
              <div id="personal-information" className="md:col-span-1 lg:col-span-2 scroll-mt-24">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-[#E68B00] mb-6">
                    Personal Information
                  </h2>

                  <div className="space-y-6">
                    {/* Profile Completed Notice */}
                    {isProfileCompleted && (
                      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          <span className="font-semibold">Profile Completed:</span> Your personal information has been submitted and is now locked. Only system administrators can update your information. Please contact an administrator if you need to make changes.
                        </p>
                      </div>
                    )}

                    {/* Row 1: First Name, Last Name – read-only from Google account */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={nameParts.firstName ?? ""}
                          readOnly
                          placeholder="First name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          aria-label="First name from Google (read-only)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={nameParts.lastName ?? ""}
                          readOnly
                          placeholder="Last name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          aria-label="Last name from Google (read-only)"
                        />
                      </div>
                    </div>

                    {/* Row 2: Gender, Student Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          id="onboard-gender"
                          value={formData.gender}
                          onChange={(e) =>
                            handleFieldChange("gender", e.target.value)
                          }
                          disabled={isProfileCompleted || !isFieldEditableDuringOnboarding("gender")}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all ${
                            isProfileCompleted || !isFieldEditableDuringOnboarding("gender")
                              ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300"
                              : fieldErrors?.gender
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300"
                          } ${
                            shouldShowGuide && onboardingStep === 1 && !formData.gender
                              ? "ring-2 ring-[#E68B00]"
                              : ""
                          }`}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        {fieldErrors?.gender && (
                          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.gender}</p>
                        )}
                        {shouldShowGuide && onboardingStep === 1 && (
                          <OnboardingStepCard
                            step={1}
                            totalSteps={3}
                            title="Gender"
                            description="Select your gender so we can show the right uniforms for you."
                            onSkip={() => handleOnboardingStepChange(2)}
                            onContinue={() => handleOnboardingStepChange(2)}
                            isLastStep={false}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Student Number
                        </label>
                        <input
                          id="onboard-student-number"
                          type="text"
                          value={formData.studentNumber}
                          onChange={(e) =>
                            handleFieldChange("studentNumber", e.target.value)
                          }
                          disabled={isProfileCompleted || !isFieldEditableDuringOnboarding("studentNumber")}
                          placeholder={STUDENT_NUMBER_PLACEHOLDER}
                          maxLength={11}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all ${
                            isProfileCompleted || !isFieldEditableDuringOnboarding("studentNumber")
                              ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300"
                              : fieldErrors?.studentNumber
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300"
                          } ${
                            shouldShowGuide &&
                            onboardingStep === 2 &&
                            !String(formData.studentNumber || "").trim()
                              ? "ring-2 ring-[#E68B00]"
                              : ""
                          }`}
                        />
                        {fieldErrors?.studentNumber && (
                          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.studentNumber}</p>
                        )}
                        {user?.name && getSuggestedInitials(user.name) && !fieldErrors?.studentNumber && (
                          <p className="mt-1 text-xs text-[#003363]">
                            Your initials from name &quot;{user.name}&quot;:{" "}
                            <span className="font-medium">{getSuggestedInitials(user.name)}</span>
                          </p>
                        )}
                        {shouldShowGuide && onboardingStep === 2 && (
                          <OnboardingStepCard
                            step={2}
                            totalSteps={3}
                            title="Student Number"
                            description="Enter your student number so we can verify and track your orders."
                            onSkip={() => handleOnboardingStepChange(3)}
                            onContinue={() => handleOnboardingStepChange(3)}
                            isLastStep={false}
                          />
                        )}
                      </div>
                    </div>

                    {/* Row 3: Course & Year Level */}
                    <div className="relative">
                      {shouldShowGuide && onboardingStep === 3 && (
                        <div className="mb-3 relative" aria-label="Onboarding guide">
                          {/* Triangle pointer pointing down to the field below */}
                          <div
                            className="absolute -bottom-2 left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-orange-200 z-10"
                            aria-hidden
                          />
                          <div className="rounded-xl border border-orange-200 bg-orange-50/80 shadow-md p-4">
                            <p className="text-xs font-semibold text-[#003363] mb-1">Step 3 of 3</p>
                            <h2 className="text-base font-bold text-[#003363] mb-1">Course & Year Level</h2>
                            <p className="text-sm text-gray-700 mb-4">Choose your course and year level so we can show only the uniforms you are eligible for.</p>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleDismissOnboarding}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
                              >
                                Skip
                              </button>
                              <button
                                type="button"
                                onClick={handleDismissOnboarding}
                                className="px-5 py-2 bg-[#003363] text-white rounded-lg hover:bg-[#002347] transition-colors font-medium text-sm"
                              >
                                Finish
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Course & Year Level{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="onboard-course-year"
                        value={formData.courseYearLevel}
                        onChange={(e) =>
                          handleFieldChange("courseYearLevel", e.target.value)
                        }
                        disabled={isProfileCompleted || !isFieldEditableDuringOnboarding("courseYearLevel")}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all ${
                          isProfileCompleted || !isFieldEditableDuringOnboarding("courseYearLevel")
                            ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300"
                            : fieldErrors?.courseYearLevel
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        } ${
                          shouldShowGuide && onboardingStep === 3 && !formData.courseYearLevel
                            ? "ring-2 ring-[#E68B00]"
                            : ""
                        }`}
                      >
                        <option value="">Select Course & Year Level</option>

                        {/* Preschool */}
                        <optgroup label="Preschool">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "Preschool")
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>

                        {/* Elementary */}
                        <optgroup label="Elementary (Grades 1-6)">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "Elementary")
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>

                        {/* Junior High School */}
                        <optgroup label="Junior High School (Grades 7-10)">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "Junior High School")
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>

                        {/* Senior High School */}
                        <optgroup label="Senior High School (Grades 11-12)">
                          {courseYearLevelOptions
                            .filter(
                              (opt) => opt.category === "Senior High School"
                            )
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>

                        {/* College */}
                        <optgroup label="College Programs">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "College")
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>

                      </select>
                      {fieldErrors?.courseYearLevel && (
                        <p className="mt-1.5 text-xs text-red-600">{fieldErrors.courseYearLevel}</p>
                      )}
                    </div>

                    {/* Row 4: Student Type (Auto-detected, Read-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Student Type
                      </label>
                      <div className={`px-4 py-3 border rounded-lg bg-gray-50 text-gray-700 ${
                        fieldErrors?.studentType ? "border-red-500" : "border-gray-300"
                      }`}>
                        {formData.studentType ? (
                          <span className="font-medium capitalize">
                            {formData.studentType === "old" ? "Old Student" : "New Student"}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            Enter your student number to automatically determine student type
                          </span>
                        )}
                      </div>
                      {fieldErrors?.studentType && (
                        <p className="mt-1.5 text-xs text-red-600">{fieldErrors.studentType}</p>
                      )}
                      {!fieldErrors?.studentType && (
                        <p className="text-xs text-gray-500 mt-2">
                          Automatically determined from your student number
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData?.email || ""}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row justify-end gap-4 mt-6">
                  <button
                    onClick={() => {
                      if (hasChanges) {
                        setShowDiscardModal(true);
                      }
                    }}
                    disabled={!hasChanges || isProfileCompleted}
                    className={`px-6 py-3 rounded-lg  font-medium transition-colors ${
                      hasChanges && !isProfileCompleted
                        ? "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Discard Changes
                  </button>

                  <button
                    id="onboard-save"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || saving}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      hasChanges && !saving
                        ? "bg-[#E68B00] text-white hover:bg-[#d97d00]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#003363] mb-4">
              Discard Changes?
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentSettings;
