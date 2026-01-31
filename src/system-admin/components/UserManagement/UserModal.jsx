import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLastSystemAdmin, setIsLastSystemAdmin] = useState(false);

  // Check if email is a student email (only @student.laverdad.edu.ph)
  const isStudentEmail = formData.email.toLowerCase().endsWith("@student.laverdad.edu.ph");

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
  
  // Handle role change
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole,
    }));
  };

  useEffect(() => {
    if (user) {
      // Split name into first and last name if editing
      const rawName = (user.name || "").trim();
      let firstName = "";
      let lastName = "";

      if (rawName) {
        const spaceParts = rawName.split(/\s+/);
        if (spaceParts.length >= 2) {
          // "John Doe" or "John Doe Smith" -> first = first word, last = rest
          firstName = spaceParts[0] || "";
          lastName = spaceParts.slice(1).join(" ") || "";
        } else if (spaceParts.length === 1 && spaceParts[0].includes(".")) {
          // Single part with a dot, e.g. "leorenzbien.rodriguez" (common for email-style names)
          const dotParts = spaceParts[0].split(".");
          if (dotParts.length >= 2) {
            firstName = dotParts[0] || "";
            lastName = dotParts.slice(1).join(".") || "";
          } else {
            firstName = spaceParts[0] || "";
          }
        } else {
          firstName = spaceParts[0] || "";
        }
      }

      setFormData({
        firstName,
        lastName,
        email: user.email || "",
        role: user.role || "",
      });

      // Set isLastSystemAdmin flag if provided by backend
      setIsLastSystemAdmin(user.isLastSystemAdmin || false);
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
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
      is_active: true, // Default to active for new users
    };
    
    onSave(saveData);
  };
  


  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000
      }}
      onClick={(e) => {
        // Close modal when clicking outside
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative z-[10001] sm:max-h-[90vh] sm:rounded-lg"
        style={{ 
          zIndex: 10001,
          // On mobile, make it nearly full screen and start from top
          maxHeight: 'calc(100vh - 2rem)',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* Role */}
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
              <option value="property_custodian">Property Custodian</option>
              <option value="system_admin">System Admin</option>
              <option value="finance_staff">Finance Staff</option>
              <option value="accounting_staff">Accounting Staff</option>
              <option value="department_head">Department Head</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
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
    </div>,
    document.body
  );
};

export default UserModal;


