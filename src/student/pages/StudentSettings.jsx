import React, { useRef, useState } from "react";
import { Camera, Upload, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import Footer from "../../components/common/Footer";
import { useStudentSettings } from "../hooks";

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
    handleRemovePhoto,
    handleFieldChange,
    handleSaveChanges,
    handleDiscardChanges,
  } = useStudentSettings();

  // Course & Year Level options - Combined dropdown
  const courseYearLevelOptions = [
    // Kindergarten
    { value: "Kinder", label: "Kinder", category: "Kindergarten" },

    // Elementary (Grades 1-6)
    { value: "Grade 1", label: "Grade 1", category: "Elementary" },
    { value: "Grade 2", label: "Grade 2", category: "Elementary" },
    { value: "Grade 3", label: "Grade 3", category: "Elementary" },
    { value: "Grade 4", label: "Grade 4", category: "Elementary" },
    { value: "Grade 5", label: "Grade 5", category: "Elementary" },
    { value: "Grade 6", label: "Grade 6", category: "Elementary" },

    // High School (Grades 7-10)
    { value: "Grade 7", label: "Grade 7", category: "High School" },
    { value: "Grade 8", label: "Grade 8", category: "High School" },
    { value: "Grade 9", label: "Grade 9", category: "High School" },
    { value: "Grade 10", label: "Grade 10", category: "High School" },

    // Senior High School (Grades 11-12)
    { value: "Grade 11", label: "Grade 11", category: "Senior High School" },
    { value: "Grade 12", label: "Grade 12", category: "Senior High School" },

    // College Programs
    // BS Information Systems
    { value: "BSIS 1st Year", label: "BSIS 1st Year", category: "College" },
    { value: "BSIS 2nd Year", label: "BSIS 2nd Year", category: "College" },
    { value: "BSIS 3rd Year", label: "BSIS 3rd Year", category: "College" },
    { value: "BSIS 4th Year", label: "BSIS 4th Year", category: "College" },

    // BS Accountancy
    { value: "BSA 1st Year", label: "BSA 1st Year", category: "College" },
    { value: "BSA 2nd Year", label: "BSA 2nd Year", category: "College" },
    { value: "BSA 3rd Year", label: "BSA 3rd Year", category: "College" },
    { value: "BSA 4th Year", label: "BSA 4th Year", category: "College" },

    // BS Accounting Information Systems
    { value: "BSAIS 1st Year", label: "BSAIS 1st Year", category: "College" },
    { value: "BSAIS 2nd Year", label: "BSAIS 2nd Year", category: "College" },
    { value: "BSAIS 3rd Year", label: "BSAIS 3rd Year", category: "College" },
    { value: "BSAIS 4th Year", label: "BSAIS 4th Year", category: "College" },

    // BS Social Work
    { value: "BSSW 1st Year", label: "BSSW 1st Year", category: "College" },
    { value: "BSSW 2nd Year", label: "BSSW 2nd Year", category: "College" },
    { value: "BSSW 3rd Year", label: "BSSW 3rd Year", category: "College" },
    { value: "BSSW 4th Year", label: "BSSW 4th Year", category: "College" },

    // Bachelor of Arts in Broadcasting
    { value: "BAB 1st Year", label: "BAB 1st Year", category: "College" },
    { value: "BAB 2nd Year", label: "BAB 2nd Year", category: "College" },
    { value: "BAB 3rd Year", label: "BAB 3rd Year", category: "College" },
    { value: "BAB 4th Year", label: "BAB 4th Year", category: "College" },

    // Vocational
    // Associate in Computer Technology
    { value: "ACT 1st Year", label: "ACT 1st Year", category: "Vocational" },
    { value: "ACT 2nd Year", label: "ACT 2nd Year", category: "Vocational" },
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

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section - Fixed background */}
      <HeroSection />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10 pb-8">
        {/* Main Container */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md p-6 md:p-8 lg:p-10">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-[#003363] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-[#003363]">User </span>
              <span className="text-[#C5A572]">Settings</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Profile Picture Section */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-[#003363] mb-4">
                    Profile Picture
                  </h2>

                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-40 h-40 rounded-full border-4 border-[#C5A572] object-cover cursor-pointer transition-opacity group-hover:opacity-75"
                          onClick={triggerFileInput}
                        />
                      ) : (
                        <div
                          className="w-40 h-40 rounded-full border-4 border-[#C5A572] bg-[#003363] flex items-center justify-center cursor-pointer transition-opacity group-hover:opacity-75"
                          onClick={triggerFileInput}
                        >
                          <span className="text-5xl font-bold text-white">
                            {profileData?.name?.charAt(0).toUpperCase() || "S"}
                          </span>
                        </div>
                      )}

                      {/* Camera Icon Overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={triggerFileInput}
                      >
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 text-center">
                      Click image to change
                    </p>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={triggerFileInput}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#003363] text-white rounded-lg hover:bg-[#002347] transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload New Photo</span>
                    </button>

                    {imagePreview && (
                      <button
                        onClick={handleRemovePhoto}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Image Requirements */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold mb-2">
                      Image Requirements:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Format: JPG, JPEG, or PNG</li>
                      <li>• Maximum size: 5MB</li>
                      <li>• Recommended: Square image</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Side - Personal Information */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-[#C5A572] mb-6">
                    Personal Information
                  </h2>

                  <div className="space-y-6">
                    {/* Name Fields */}
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

                    {/* Course & Year Level - Combined Dropdown */}
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

                        {/* Kindergarten */}
                        <optgroup label="Kindergarten">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "Kindergarten")
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

                        {/* High School */}
                        <optgroup label="High School (Grades 7-10)">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "High School")
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

                        {/* Vocational */}
                        <optgroup label="Vocational Programs">
                          {courseYearLevelOptions
                            .filter((opt) => opt.category === "Vocational")
                            .map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Student Number */}
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
                      <p className="text-xs text-gray-500 mt-2">
                        Email cannot be changed (linked to Google OAuth)
                      </p>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-semibold">
                            Information Notice
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Your name and email are managed through your Google
                            account and cannot be edited here. You can update
                            your profile picture, course & year level, and
                            student number.
                          </p>
                          <p className="text-xs text-blue-700 mt-2">
                            <strong>Note:</strong> Your course & year level
                            determines which uniforms are available to you on
                            the products page. Select the appropriate education
                            level to see relevant items.
                          </p>
                        </div>
                      </div>
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
                        ? "bg-[#C5A572] text-white hover:bg-[#b8985f]"
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
