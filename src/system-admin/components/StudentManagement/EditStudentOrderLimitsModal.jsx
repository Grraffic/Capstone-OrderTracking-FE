import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { splitDisplayName } from "../../../utils/displayName";

/**
 * EditStudentOrderLimitsModal Component
 *
 * Modal for editing a single student's information including total_item_limit, student_number, course_year_level, and student_type.
 * Used when the row Edit (pencil) is clicked.
 */
const EditStudentOrderLimitsModal = ({ isOpen, onClose, student, onSave }) => {
  // Grade level options (same as StudentSettings)
  const gradeLevelOptions = [
    { value: "Prekindergarten", label: "Prekindergarten", category: "Preschool" },
    { value: "Kindergarten", label: "Kindergarten", category: "Preschool" },
    { value: "Grade 1", label: "Grade 1", category: "Elementary" },
    { value: "Grade 2", label: "Grade 2", category: "Elementary" },
    { value: "Grade 3", label: "Grade 3", category: "Elementary" },
    { value: "Grade 4", label: "Grade 4", category: "Elementary" },
    { value: "Grade 5", label: "Grade 5", category: "Elementary" },
    { value: "Grade 6", label: "Grade 6", category: "Elementary" },
    { value: "Grade 7", label: "Grade 7", category: "Junior High School" },
    { value: "Grade 8", label: "Grade 8", category: "Junior High School" },
    { value: "Grade 9", label: "Grade 9", category: "Junior High School" },
    { value: "Grade 10", label: "Grade 10", category: "Junior High School" },
    { value: "Grade 11", label: "Grade 11", category: "Senior High School" },
    { value: "Grade 12", label: "Grade 12", category: "Senior High School" },
    { value: "BSIS 1st Year", label: "BS in Information Systems 1st Year", category: "College" },
    { value: "BSIS 2nd Year", label: "BS in Information Systems 2nd Year", category: "College" },
    { value: "BSIS 3rd Year", label: "BS in Information Systems 3rd Year", category: "College" },
    { value: "BSIS 4th Year", label: "BS in Information Systems 4th Year", category: "College" },
    { value: "BSA 1st Year", label: "BS in Accountancy 1st Year", category: "College" },
    { value: "BSA 2nd Year", label: "BS in Accountancy 2nd Year", category: "College" },
    { value: "BSA 3rd Year", label: "BS in Accountancy 3rd Year", category: "College" },
    { value: "BSA 4th Year", label: "BS in Accountancy 4th Year", category: "College" },
    { value: "BSAIS 1st Year", label: "BS in Accounting Information Systems 1st Year", category: "College" },
    { value: "BSAIS 2nd Year", label: "BS in Accounting Information Systems 2nd Year", category: "College" },
    { value: "BSAIS 3rd Year", label: "BS in Accounting Information Systems 3rd Year", category: "College" },
    { value: "BSAIS 4th Year", label: "BS in Accounting Information Systems 4th Year", category: "College" },
    { value: "BSSW 1st Year", label: "BS in Social Work 1st Year", category: "College" },
    { value: "BSSW 2nd Year", label: "BS in Social Work 2nd Year", category: "College" },
    { value: "BSSW 3rd Year", label: "BS in Social Work 3rd Year", category: "College" },
    { value: "BSSW 4th Year", label: "BS in Social Work 4th Year", category: "College" },
    { value: "BAB 1st Year", label: "Bachelor of Arts in Broadcasting 1st Year", category: "College" },
    { value: "BAB 2nd Year", label: "Bachelor of Arts in Broadcasting 2nd Year", category: "College" },
    { value: "BAB 3rd Year", label: "Bachelor of Arts in Broadcasting 3rd Year", category: "College" },
    { value: "BAB 4th Year", label: "Bachelor of Arts in Broadcasting 4th Year", category: "College" },
    { value: "ACT 1st Year", label: "Associate in Computer Technology 1st Year", category: "College" },
    { value: "ACT 2nd Year", label: "Associate in Computer Technology 2nd Year", category: "College" },
  ];

  // Map course & year level to education level (same logic as useStudentSettings)
  const getEducationLevel = (courseYearLevel) => {
    if (!courseYearLevel) return null;
    if (courseYearLevel === "Prekindergarten" || courseYearLevel === "Kindergarten" || courseYearLevel === "Kinder") {
      return "Kindergarten";
    }
    if (courseYearLevel.match(/^Grade [1-6]$/)) {
      return "Elementary";
    }
    if (courseYearLevel.match(/^Grade (7|8|9|10)$/)) {
      return "Junior High School";
    }
    if (courseYearLevel.match(/^Grade (11|12)$/)) {
      return "Senior High School";
    }
    if (courseYearLevel.match(/^(BSIS|BSA|BSAIS|BSSW|BAB|ACT) (1st|2nd|3rd|4th) Year$/)) {
      return "College";
    }
    return null;
  };

  const [formData, setFormData] = useState({
    maxItemsPerOrder: "",
    studentNumber: "",
    courseYearLevel: "",
    studentType: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // Prefill from student when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        maxItemsPerOrder:
          student.total_item_limit != null && student.total_item_limit !== ""
            ? String(student.total_item_limit)
            : "",
        studentNumber: student.student_number || "",
        courseYearLevel: student.course_year_level || "",
        studentType: student.student_type || "",
        gender: student.gender || "",
      });
      setErrors({});
    }
  }, [isOpen, student]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({ 
        maxItemsPerOrder: "",
        studentNumber: "",
        courseYearLevel: "",
        studentType: "",
        gender: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    // For numeric fields (maxItemsPerOrder), only allow numbers
    if (field === "maxItemsPerOrder") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [field]: numericValue,
      }));
    } else if (field === "studentNumber") {
      // Student ID can contain alphanumeric characters, dashes, and underscores
      const alphanumericValue = value.replace(/[^a-zA-Z0-9\-_]/g, "");
      setFormData((prev) => ({
        ...prev,
        [field]: alphanumericValue,
      }));
    } else {
      // For other fields, allow any value
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleIncrement = (field) => {
    const currentValue = parseInt(formData[field]) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: (currentValue + 1).toString(),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Total Item Limit is optional, but if provided, it must be at least 1
    if (formData.maxItemsPerOrder && parseInt(formData.maxItemsPerOrder) < 1) {
      newErrors.maxItemsPerOrder = "Must be at least 1";
    }
    
    // Validate Grade Level - cannot be empty/default
    if (!formData.courseYearLevel || formData.courseYearLevel.trim() === "") {
      newErrors.courseYearLevel = "Please select a Grade Level";
    }
    
    // Validate Student Type - cannot be empty/default
    if (!formData.studentType || formData.studentType.trim() === "") {
      newErrors.studentType = "Please select a Student Type";
    }
    
    // Validate Gender - cannot be empty/default
    if (!formData.gender || formData.gender.trim() === "") {
      newErrors.gender = "Please select a Gender";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updateData = {};
    // Total Item Limit is optional - only include if provided
    if (formData.maxItemsPerOrder && formData.maxItemsPerOrder.trim() !== "") {
      updateData.total_item_limit = parseInt(formData.maxItemsPerOrder);
    }
    if (formData.studentNumber !== undefined) {
      updateData.student_number = formData.studentNumber.trim() || null;
    }
    if (formData.courseYearLevel !== undefined) {
      updateData.course_year_level = formData.courseYearLevel.trim() || null;
      // Calculate education_level from course_year_level
      const educationLevel = getEducationLevel(formData.courseYearLevel);
      if (educationLevel) {
        updateData.education_level = educationLevel;
      }
    }
    if (formData.studentType !== undefined) {
      updateData.student_type = formData.studentType.trim().toLowerCase() || null;
    }
    if (formData.gender !== undefined) {
      updateData.gender = formData.gender.trim() || null;
    }

    onSave(updateData);
  };

  if (!isOpen) return null;

  const displayName = student ? splitDisplayName(student.name || "").displayName || "Student" : "Student";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full z-[10000]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#0C2340]">
            <span className="text-[#e68b00]">Edit Order Limits</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">
              Editing: <span className="font-semibold text-[#003363]">{displayName}</span>
            </p>
          </div>


          {/* Student Information Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Student ID */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Student ID
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={formData.studentNumber}
                      onChange={(e) => handleInputChange("studentNumber", e.target.value)}
                      placeholder="e.g. 22-11223"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm"
                    />
                  </td>
                </tr>
                {/* Grade Level */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Grade Level <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.courseYearLevel}
                      onChange={(e) => handleInputChange("courseYearLevel", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm ${
                        errors.courseYearLevel ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Grade Level</option>
                      <optgroup label="Preschool">
                        {gradeLevelOptions
                          .filter((opt) => opt.category === "Preschool")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Elementary">
                        {gradeLevelOptions
                          .filter((opt) => opt.category === "Elementary")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Junior High School">
                        {gradeLevelOptions
                          .filter((opt) => opt.category === "Junior High School")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Senior High School">
                        {gradeLevelOptions
                          .filter((opt) => opt.category === "Senior High School")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="College">
                        {gradeLevelOptions
                          .filter((opt) => opt.category === "College")
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    {errors.courseYearLevel && (
                      <p className="text-red-600 text-xs mt-1">{errors.courseYearLevel}</p>
                    )}
                  </td>
                </tr>
                {/* Student Type */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Student Type <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.studentType}
                      onChange={(e) => handleInputChange("studentType", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm ${
                        errors.studentType ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Student Type</option>
                      <option value="new">New Student</option>
                      <option value="old">Old Student</option>
                    </select>
                    {errors.studentType && (
                      <p className="text-red-600 text-xs mt-1">{errors.studentType}</p>
                    )}
                  </td>
                </tr>
                {/* Gender */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Gender <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm ${
                        errors.gender ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-600 text-xs mt-1">{errors.gender}</p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-t border-gray-200">
          {/* Total Item Limit - Optional field next to buttons */}
          <div className="flex-1 sm:flex-initial">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Item Limit <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.maxItemsPerOrder}
                onChange={(e) => handleInputChange("maxItemsPerOrder", e.target.value)}
                placeholder="e.g. 5"
                className={`w-full sm:w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm ${
                  errors.maxItemsPerOrder ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => handleIncrement("maxItemsPerOrder")}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Increment"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
            </div>
            {errors.maxItemsPerOrder && (
              <p className="text-red-600 text-xs mt-1">{errors.maxItemsPerOrder}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Students cannot place orders until this is set.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentOrderLimitsModal;
