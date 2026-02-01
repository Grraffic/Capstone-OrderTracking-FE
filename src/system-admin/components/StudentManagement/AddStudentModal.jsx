import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  isValidStudentNumber,
  normalizeStudentNumber,
  STUDENT_NUMBER_PLACEHOLDER,
  STUDENT_NUMBER_FORMAT_HINT,
} from "../../../utils/studentNumberFormat";

/**
 * AddStudentModal Component
 * 
 * Modal for adding a new student
 */
const AddStudentModal = ({ isOpen, onClose, onSave, educationLevels, gradeLevelOptions }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentNumber: "",
    gender: "",
    studentType: "",
    gradeLevel: "",
  });
  
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        studentNumber: "",
        gender: "",
        studentType: "",
        gradeLevel: "",
      });
      setFieldErrors({});
    }
  }, [isOpen]);

  // Auto-generate email from first and last name
  React.useEffect(() => {
    if (formData.firstName && formData.lastName) {
      // Remove spaces and convert to lowercase
      const firstName = formData.firstName.trim().toLowerCase().replace(/\s+/g, '');
      const lastName = formData.lastName.trim().toLowerCase().replace(/\s+/g, '');
      const suggestedEmail = `${firstName}${lastName}@student.laverdad.edu.ph`;
      
      // Only update if email is empty or matches the old pattern
      const currentEmail = formData.email || '';
      if (!currentEmail || currentEmail.includes('@student.laverdad.edu.ph')) {
        setFormData(prev => ({
          ...prev,
          email: suggestedEmail,
        }));
      }
    }
  }, [formData.firstName, formData.lastName]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!formData.email.toLowerCase().endsWith("@student.laverdad.edu.ph")) {
      errors.email = "Email must end with @student.laverdad.edu.ph";
    }
    
    if (!formData.studentNumber.trim()) {
      errors.studentNumber = "Student number is required";
    } else {
      const normalizedStudentNumber = normalizeStudentNumber(formData.studentNumber);
      if (!isValidStudentNumber(normalizedStudentNumber)) {
        errors.studentNumber = "Student number must match format: YY-NNNNNIII (e.g. 22-00023RSR)";
      }
    }
    
    if (!formData.gender || formData.gender.trim() === "") {
      errors.gender = "Gender is required";
    }
    
    if (!formData.studentType || formData.studentType.trim() === "") {
      errors.studentType = "Student type is required";
    }
    
    if (!formData.gradeLevel || formData.gradeLevel === "Grade Level") {
      errors.gradeLevel = "Course & Year Level is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Normalize and validate student number before submitting
    const normalizedStudentNumber = normalizeStudentNumber(formData.studentNumber.trim());
    if (!isValidStudentNumber(normalizedStudentNumber)) {
      setFieldErrors({
        studentNumber: "Student number must match format: YY-NNNNNIII (e.g. 22-00023RSR)",
      });
      return;
    }

    // Prepare student data
    const studentData = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim().toLowerCase(),
      role: "student",
      student_number: normalizedStudentNumber, // Use normalized version
      gender: formData.gender.trim(),
      student_type: formData.studentType.trim().toLowerCase(),
      course_year_level: formData.gradeLevel,
      total_item_limit: 8, // Automatically set to 8
    };

    onSave(studentData);
  };

  // Map course & year level abbreviations to full names for display
  const getGradeLevelDisplayName = (value) => {
    const displayMap = {
      "BSIS 1st yr": "BS in Information Systems 1st Year",
      "BSIS 2nd yr": "BS in Information Systems 2nd Year",
      "BSIS 3rd yr": "BS in Information Systems 3rd Year",
      "BSIS 4th yr": "BS in Information Systems 4th Year",
      "BSIS 1st year": "BS in Information Systems 1st Year",
      "BSIS 2nd year": "BS in Information Systems 2nd Year",
      "BSIS 3rd year": "BS in Information Systems 3rd Year",
      "BSIS 4th year": "BS in Information Systems 4th Year",
      "BSA 1st yr": "BS in Accountancy 1st Year",
      "BSA 2nd yr": "BS in Accountancy 2nd Year",
      "BSA 3rd yr": "BS in Accountancy 3rd Year",
      "BSA 4th yr": "BS in Accountancy 4th Year",
      "BSAIS 1st year": "BS in Accounting Information Systems 1st Year",
      "BSAIS 2nd year": "BS in Accounting Information Systems 2nd Year",
      "BSAIS 3rd year": "BS in Accounting Information Systems 3rd Year",
      "BSAIS 4th year": "BS in Accounting Information Systems 4th Year",
      "BAB 1st year": "Bachelor of Arts in Broadcasting 1st Year",
      "BAB 2nd year": "Bachelor of Arts in Broadcasting 2nd Year",
      "BAB 3rd year": "Bachelor of Arts in Broadcasting 3rd Year",
      "BAB 4th year": "Bachelor of Arts in Broadcasting 4th Year",
      "BSSW 1st year": "BS in Social Work 1st Year",
      "BSSW 2nd year": "BS in Social Work 2nd Year",
      "BSSW 3rd year": "BS in Social Work 3rd Year",
      "BSSW 4th year": "BS in Social Work 4th Year",
      "ACT 1st year": "Associate in Computer Technology 1st Year",
      "ACT 2nd year": "Associate in Computer Technology 2nd Year",
    };
    
    return displayMap[value] || value;
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0C2340]">Add Student</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name and Last Name - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-[#0C2340] mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-[#0C2340] mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#0C2340] mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="firstname.lastname@student.laverdad.edu.ph"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Student Number and Gender - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Student Number */}
            <div>
              <label className="block text-sm font-medium text-[#0C2340] mb-2">
                Student Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.studentNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, studentNumber: value }));
                  // Clear error when user starts typing
                  if (fieldErrors.studentNumber) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.studentNumber;
                      return newErrors;
                    });
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur for better UX
                  const value = e.target.value.trim();
                  if (value) {
                    const normalized = normalizeStudentNumber(value);
                    if (!isValidStudentNumber(normalized)) {
                      setFieldErrors(prev => ({
                        ...prev,
                        studentNumber: "Student number must match format: YY-NNNNNIII (e.g. 22-00023RSR)",
                      }));
                    }
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.studentNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={STUDENT_NUMBER_PLACEHOLDER}
                maxLength={11}
              />
              {fieldErrors.studentNumber && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.studentNumber}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-[#0C2340] mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.gender ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {fieldErrors.gender && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.gender}</p>
              )}
            </div>
          </div>

          {/* Student Type */}
          <div>
            <label className="block text-sm font-medium text-[#0C2340] mb-2">
              Student Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentType}
              onChange={(e) => setFormData(prev => ({ ...prev, studentType: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                fieldErrors.studentType ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Student Type</option>
              <option value="new">New Student</option>
              <option value="old">Old Student</option>
            </select>
            {fieldErrors.studentType && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.studentType}</p>
            )}
          </div>

          {/* Course & Year Level */}
          <div>
            <label className="block text-sm font-medium text-[#0C2340] mb-2">
              Course & Year Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                fieldErrors.gradeLevel ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Course & Year Level</option>
              {gradeLevelOptions.filter(level => level !== "Grade Level").map((level) => {
                const displayName = getGradeLevelDisplayName(level);
                return (
                  <option key={level} value={level}>
                    {displayName}
                  </option>
                );
              })}
            </select>
            {fieldErrors.gradeLevel && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.gradeLevel}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0C2340] text-white font-semibold rounded-lg hover:bg-[#0a1d33] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddStudentModal;
