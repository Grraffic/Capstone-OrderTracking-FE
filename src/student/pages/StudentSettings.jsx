import React, { useRef, useState } from "react";
import { Camera, ArrowLeft, AlertCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useStudentSettings } from "../hooks";
import { getCourseBannerStyle } from "../utils/courseBanner";

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
const StudentSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Fetch settings data and functions from hook
  const {
    profileData,
    loading,
    saving,
    error,
    imagePreview,
    hasChanges,
    formData,
    handleImageSelect,
    handleFieldChange,
    handleSaveChanges,
    handleDiscardChanges,
  } = useStudentSettings();

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
    navigate(-1);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const courseLevel = formData.courseYearLevel || profileData?.courseYearLevel;
  const bannerStyle = getCourseBannerStyle(courseLevel);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
              {/* Left Side – Student profile card: responsive mobile → tablet → laptop */}
              <div className="md:col-span-1 flex flex-col min-h-0">
                <div className="relative bg-white rounded-2xl border-2 sm:border-4 border-gray-200 shadow-sm overflow-visible p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center h-full">
                  {/* Profile image + banner: banner anchored to image, scales with viewport */}
                  <div className="flex justify-center">
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48">
                      {/* Banner – on mobile: less in the border (right/down); desktop: left -17px, top -19px */}
                      {bannerStyle.label && (
                        <div
                          className={`absolute left-[-8px] top-[-12px] lg:left-[-17px] lg:top-[-19px] z-10 w-11 h-[139px] flex flex-col items-center justify-center gap-2 py-4 shadow-xl origin-top-left
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
                      <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-[#E68B00] shadow-xl group">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity group-hover:opacity-90"
                            onClick={triggerFileInput}
                          />
                        ) : (
                          <div
                            className="absolute inset-0 bg-[#003363] flex items-center justify-center cursor-pointer transition-opacity group-hover:opacity-90"
                            onClick={triggerFileInput}
                          >
                            <span className="text-4xl sm:text-5xl font-bold text-white">
                              {profileData?.name?.charAt(0).toUpperCase() || "S"}
                            </span>
                          </div>
                        )}
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/30 z-20"
                          onClick={triggerFileInput}
                        >
                          <div className="bg-white/95 rounded-full p-2 sm:p-2.5">
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#003363]" />
                          </div>
                        </div>
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
                      {profileData?.name || "Student Name"}
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
              <div id="personal-information" className="md:col-span-2 scroll-mt-24">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-[#E68B00] mb-6">
                    Personal Information
                  </h2>

                  <div className="space-y-6">
                    {/* Row 1: First Name, Last Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData?.name?.split(" ")[0] || ""}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={
                            profileData?.name?.split(" ").slice(1).join(" ") ||
                            ""
                          }
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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
                          value={formData.gender}
                          onChange={(e) =>
                            handleFieldChange("gender", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Student Number
                        </label>
                        <input
                          type="text"
                          value={formData.studentNumber}
                          onChange={(e) =>
                            handleFieldChange("studentNumber", e.target.value)
                          }
                          placeholder="e.g., 22-11223"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Row 3: Course & Year Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Course & Year Level{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.courseYearLevel}
                        onChange={(e) =>
                          handleFieldChange("courseYearLevel", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003363] focus:border-transparent transition-all"
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
                    </div>

                    {/* Row 4: Email Address */}
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
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                  <button
                    onClick={() => {
                      if (hasChanges) {
                        setShowDiscardModal(true);
                      }
                    }}
                    disabled={!hasChanges}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      hasChanges
                        ? "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Discard Changes
                  </button>

                  <button
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

      <Footer />
    </div>
  );
};

export default StudentSettings;
