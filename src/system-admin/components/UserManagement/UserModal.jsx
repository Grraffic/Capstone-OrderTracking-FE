import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

/**
 * UserModal Component
 * 
 * Modal for adding/editing users
 */
const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    status: "",
    gradeLevelAndCourse: "",
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLastSystemAdmin, setIsLastSystemAdmin] = useState(false);

  // Check if email is a student email (only @student.laverdad.edu.ph)
  const isStudentEmail = formData.email.toLowerCase().endsWith("@student.laverdad.edu.ph");
  
  // Check if grade level field should be enabled (student email AND student role)
  const shouldEnableGradeLevel = isStudentEmail && formData.role === "student";

  // Auto-fill email when typing @student.laverdad.edu.ph or @laverdad.edu.ph
  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    const emailLower = emailValue.toLowerCase();
    
    // Check if user is typing one of the domains
    if (emailLower.includes("@student.laverdad.edu.ph") || emailLower.includes("@laverdad.edu.ph")) {
      const domain = emailLower.includes("@student.laverdad.edu.ph") 
        ? "@student.laverdad.edu.ph" 
        : "@laverdad.edu.ph";
      
      // Get the part before @
      const beforeAt = emailValue.split("@")[0];
      
      // If user just typed the domain (no username) or only "@"
      if (formData.firstName && formData.lastName && (!beforeAt || beforeAt.trim() === "")) {
        const suggestedEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}${domain}`;
        // Use setTimeout to ensure the input value is updated after the current change
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            email: suggestedEmail,
          }));
        }, 0);
        return;
      }
    }
    
    // Normal email change
    setFormData(prev => ({
      ...prev,
      email: emailValue,
    }));
  };
  
  // Also handle when user types just "@" and then the domain
  const handleEmailKeyDown = (e) => {
    // If user presses space or tab after typing domain, auto-fill
    if (e.key === " " || e.key === "Tab") {
      const emailValue = e.target.value;
      const emailLower = emailValue.toLowerCase();
      
      if ((emailLower.includes("@student.laverdad.edu.ph") || emailLower.includes("@laverdad.edu.ph")) && 
          formData.firstName && formData.lastName) {
        const domain = emailLower.includes("@student.laverdad.edu.ph") 
          ? "@student.laverdad.edu.ph" 
          : "@laverdad.edu.ph";
        const beforeAt = emailValue.split("@")[0];
        
        if (!beforeAt || beforeAt.trim() === "") {
          e.preventDefault();
          const suggestedEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}${domain}`;
          setFormData(prev => ({
            ...prev,
            email: suggestedEmail,
          }));
        }
      }
    }
  };
  
  // Handle role change - reset grade level if role changes from student
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      // Clear grade level if role is not student
      gradeLevelAndCourse: newRole !== "student" ? "" : prev.gradeLevelAndCourse,
    }));
  };

  // Clear student fields if email changes and is no longer a student email or role changes
  useEffect(() => {
    if ((!isStudentEmail || formData.role !== "student") && formData.gradeLevelAndCourse) {
      setFormData(prev => ({
        ...prev,
        gradeLevelAndCourse: "",
      }));
    }
  }, [formData.email, formData.role, isStudentEmail]);

  useEffect(() => {
    if (user) {
      // Split name into first and last name if editing
      const nameParts = (user.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // Combine course_year_level and education_level for display
      const gradeLevelAndCourse = user.course_year_level && user.education_level
        ? `${user.course_year_level} - ${user.education_level}`
        : user.course_year_level || "";
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: user.email || "",
        role: user.role || "",
        status: user.is_active !== undefined ? (user.is_active ? "Active" : "Inactive") : "",
        gradeLevelAndCourse: gradeLevelAndCourse,
      });

      // Set isLastSystemAdmin flag if provided by backend
      setIsLastSystemAdmin(user.isLastSystemAdmin || false);
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        status: "",
        gradeLevelAndCourse: "",
      });
      setIsLastSystemAdmin(false);
    }
  }, [user, isOpen]);

  // Validate a single field
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    
    if (!value || (typeof value === "string" && value.trim() === "")) {
      errors[fieldName] = true;
    } else {
      delete errors[fieldName];
    }
    
    setFieldErrors(errors);
  };

  // Handle field blur to validate
  const handleFieldBlur = (fieldName, value) => {
    validateField(fieldName, value);
  };

  // Check if form is valid (all required fields filled and valid)
  const isFormValid = () => {
    // Check basic required fields
    if (!formData.firstName || formData.firstName.trim() === "") return false;
    if (!formData.lastName || formData.lastName.trim() === "") return false;
    if (!formData.email || formData.email.trim() === "") return false;
    if (!formData.role || formData.role === "") return false;
    if (!formData.status || formData.status === "") return false;

    // Check grade level for student emails with student role
    if (isStudentEmail && formData.role === "student" && !formData.gradeLevelAndCourse) {
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors = {};
    let hasErrors = false;

    if (!formData.firstName || formData.firstName.trim() === "") {
      errors.firstName = true;
      hasErrors = true;
    }

    if (!formData.lastName || formData.lastName.trim() === "") {
      errors.lastName = true;
      hasErrors = true;
    }

    if (!formData.email || formData.email.trim() === "") {
      errors.email = true;
      hasErrors = true;
    }

    if (!formData.role || formData.role === "") {
      errors.role = true;
      hasErrors = true;
    }

    if (!formData.status || formData.status === "") {
      errors.status = true;
      hasErrors = true;
    }

    // Validate grade level for student emails with student role
    if (isStudentEmail && formData.role === "student" && !formData.gradeLevelAndCourse) {
      errors.gradeLevelAndCourse = true;
      hasErrors = true;
    }

    setFieldErrors(errors);

    if (hasErrors) {
      return;
    }
    
    // Combine first and last name
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    // Prepare data for save
    const saveData = {
      name: fullName,
      email: formData.email,
      role: formData.role,
      is_active: formData.status === "Active",
    };

    // Add student-specific fields only if email is student email and role is student
    if (isStudentEmail && formData.role === "student" && formData.gradeLevelAndCourse) {
      // Parse the combined value (format: "Grade 10 - High School" or just "Grade 10")
      const parts = formData.gradeLevelAndCourse.split(" - ");
      saveData.course_year_level = parts[0] || formData.gradeLevelAndCourse;
      saveData.education_level = parts[1] || null;
    } else {
      // Clear student fields for non-students
      saveData.course_year_level = null;
      saveData.education_level = null;
    }
    
    onSave(saveData);
  };
  

  // Combined Grade Level and Course Access options
  const gradeLevelAndCourseOptions = [
    // Kindergarten
    { value: "Kinder - Kindergarten", label: "Kinder - Kindergarten" },
    // Elementary (Grades 1-6)
    { value: "Grade 1 - Elementary", label: "Grade 1 - Elementary" },
    { value: "Grade 2 - Elementary", label: "Grade 2 - Elementary" },
    { value: "Grade 3 - Elementary", label: "Grade 3 - Elementary" },
    { value: "Grade 4 - Elementary", label: "Grade 4 - Elementary" },
    { value: "Grade 5 - Elementary", label: "Grade 5 - Elementary" },
    { value: "Grade 6 - Elementary", label: "Grade 6 - Elementary" },
    // High School (Grades 7-10)
    { value: "Grade 7 - High School", label: "Grade 7 - High School" },
    { value: "Grade 8 - High School", label: "Grade 8 - High School" },
    { value: "Grade 9 - High School", label: "Grade 9 - High School" },
    { value: "Grade 10 - High School", label: "Grade 10 - High School" },
    // Senior High School (Grades 11-12)
    { value: "Grade 11 - Senior High School", label: "Grade 11 - Senior High School" },
    { value: "Grade 12 - Senior High School", label: "Grade 12 - Senior High School" },
    // College Programs
    { value: "BSIS 1st Year - College", label: "BSIS 1st Year - College" },
    { value: "BSIS 2nd Year - College", label: "BSIS 2nd Year - College" },
    { value: "BSIS 3rd Year - College", label: "BSIS 3rd Year - College" },
    { value: "BSIS 4th Year - College", label: "BSIS 4th Year - College" },
    { value: "BSA 1st Year - College", label: "BSA 1st Year - College" },
    { value: "BSA 2nd Year - College", label: "BSA 2nd Year - College" },
    { value: "BSA 3rd Year - College", label: "BSA 3rd Year - College" },
    { value: "BSA 4th Year - College", label: "BSA 4th Year - College" },
    { value: "BSAIS 1st Year - College", label: "BSAIS 1st Year - College" },
    { value: "BSAIS 2nd Year - College", label: "BSAIS 2nd Year - College" },
    { value: "BSAIS 3rd Year - College", label: "BSAIS 3rd Year - College" },
    { value: "BSAIS 4th Year - College", label: "BSAIS 4th Year - College" },
    { value: "BSSW 1st Year - College", label: "BSSW 1st Year - College" },
    { value: "BSSW 2nd Year - College", label: "BSSW 2nd Year - College" },
    { value: "BSSW 3rd Year - College", label: "BSSW 3rd Year - College" },
    { value: "BSSW 4th Year - College", label: "BSSW 4th Year - College" },
    { value: "BAB 1st Year - College", label: "BAB 1st Year - College" },
    { value: "BAB 2nd Year - College", label: "BAB 2nd Year - College" },
    { value: "BAB 3rd Year - College", label: "BAB 3rd Year - College" },
    { value: "BAB 4th Year - College", label: "BAB 4th Year - College" },
    // Vocational
    { value: "ACT 1st Year - Vocational", label: "ACT 1st Year - Vocational" },
    { value: "ACT 2nd Year - Vocational", label: "ACT 2nd Year - Vocational" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-[10000]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#0C2340]">
            {user ? "Edit User" : "Add User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name and Last Name - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (fieldErrors.firstName) {
                    setFieldErrors(prev => ({ ...prev, firstName: false }));
                  }
                }}
                onBlur={() => handleFieldBlur("firstName", formData.firstName)}
                placeholder="Enter first name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  if (fieldErrors.lastName) {
                    setFieldErrors(prev => ({ ...prev, lastName: false }));
                  }
                }}
                onBlur={() => handleFieldBlur("lastName", formData.lastName)}
                placeholder="Enter last name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  fieldErrors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                handleEmailChange(e);
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: false }));
                }
              }}
              onKeyDown={handleEmailKeyDown}
              onBlur={(e) => {
                // Validate email field
                handleFieldBlur("email", formData.email);
                
                // Auto-fill on blur if domain is typed but no username
                const emailValue = e.target.value;
                const emailLower = emailValue.toLowerCase();
                
                if ((emailLower.includes("@student.laverdad.edu.ph") || emailLower.includes("@laverdad.edu.ph")) && 
                    formData.firstName && formData.lastName) {
                  const domain = emailLower.includes("@student.laverdad.edu.ph") 
                    ? "@student.laverdad.edu.ph" 
                    : "@laverdad.edu.ph";
                  const beforeAt = emailValue.split("@")[0];
                  
                  if (!beforeAt || beforeAt.trim() === "") {
                    const suggestedEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}${domain}`;
                    setFormData(prev => ({
                      ...prev,
                      email: suggestedEmail,
                    }));
                  }
                }
              }}
              placeholder="Enter email address"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              required
              disabled={!!user} // Don't allow editing email for existing users
            />
          </div>

          {/* Role and Status - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  handleRoleChange(e);
                  if (fieldErrors.role) {
                    setFieldErrors(prev => ({ ...prev, role: false }));
                  }
                }}
                onBlur={() => handleFieldBlur("role", formData.role)}
                disabled={isLastSystemAdmin && formData.role === "system_admin"}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] bg-white ${
                  fieldErrors.role ? "border-red-500" : "border-gray-300"
                } ${
                  isLastSystemAdmin && formData.role === "system_admin" 
                    ? "bg-gray-50 text-gray-500 cursor-not-allowed" 
                    : ""
                }`}
                required
              >
                <option value="">Select user role</option>
                <option value="student">Student</option>
                {!isStudentEmail && (
                  <>
                    <option value="property_custodian">Property Custodian</option>
                    <option value="system_admin">System Admin</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  setFormData({ ...formData, status: e.target.value });
                  if (fieldErrors.status) {
                    setFieldErrors(prev => ({ ...prev, status: false }));
                  }
                }}
                onBlur={() => handleFieldBlur("status", formData.status)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] bg-white ${
                  fieldErrors.status ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Grade Level and Course Access - Always visible as placeholder, active only for student emails with student role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level and Course Access
            </label>
            <div className="relative">
                <select
                  value={formData.gradeLevelAndCourse}
                  onChange={(e) => {
                    setFormData({ ...formData, gradeLevelAndCourse: e.target.value });
                    if (fieldErrors.gradeLevelAndCourse) {
                      setFieldErrors(prev => ({ ...prev, gradeLevelAndCourse: false }));
                    }
                  }}
                  onBlur={() => {
                    if (shouldEnableGradeLevel && !formData.gradeLevelAndCourse) {
                      setFieldErrors(prev => ({ ...prev, gradeLevelAndCourse: true }));
                    }
                  }}
                  disabled={!shouldEnableGradeLevel}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] bg-white appearance-none pr-10 ${
                    !shouldEnableGradeLevel 
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                      : ""
                  } ${
                    fieldErrors.gradeLevelAndCourse ? "border-red-500" : "border-gray-300"
                  }`}
                  required={shouldEnableGradeLevel}
                >
                <option value="">Grade Level and Course Access</option>
                {shouldEnableGradeLevel && gradeLevelAndCourseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none w-5 h-5 ${
                !shouldEnableGradeLevel ? "text-gray-300" : "text-gray-400"
              }`} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                isFormValid()
                  ? "bg-[#0C2340] text-white hover:bg-[#0a1d33] cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {user ? "Update" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;


