import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import { splitDisplayName } from "../../../utils/displayName";
import studentPermissionsAPI from "../../../services/studentPermissions.service";
import { toast } from "react-hot-toast";
import { getDefaultMaxForItem, normalizeItemName } from "../../../utils/maxQuantityKeys";
import { getStudentTypeFromStudentNumber } from "../../../utils/studentNumberFormat";
import api from "../../../services/api";
import { useSocket } from "../../../context/SocketContext";

/**
 * EditStudentOrderLimitsModal Component
 *
 * Modal for editing a single student's information including total_item_limit, student_number, course_year_level, and student_type.
 * Also includes item eligibility management with checkboxes and quantities.
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
    name: "",
    courseYearLevel: "",
    studentType: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [itemPermissions, setItemPermissions] = useState({}); // {itemName: {enabled: boolean, quantity: number|null}}
  const [loadingItems, setLoadingItems] = useState(false);

  // Socket.IO for real-time permission updates
  const { on, off, isConnected } = useSocket();

  // Prefill from student when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        maxItemsPerOrder:
          student.total_item_limit != null && student.total_item_limit !== ""
            ? String(student.total_item_limit)
            : "",
        studentNumber: student.student_number || "",
        name: student.name || "",
        courseYearLevel: student.course_year_level || "",
        studentType: student.student_type || "",
        gender: student.gender || "",
      });
      setErrors({});
    }
  }, [isOpen, student]);

  // Auto-detect student type from student number when it changes
  useEffect(() => {
    if (!formData.studentNumber || !formData.studentNumber.trim()) return;
    
    const detectedType = getStudentTypeFromStudentNumber(formData.studentNumber);
    if (detectedType) {
      // Auto-set student type, but admin can still override manually
      setFormData((prev) => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.studentType !== detectedType) {
          return {
            ...prev,
            studentType: detectedType,
          };
        }
        return prev;
      });
    }
  }, [formData.studentNumber]);

  // Also auto-detect when modal opens with existing student data
  useEffect(() => {
    if (isOpen && student?.student_number && !formData.studentType) {
      const detectedType = getStudentTypeFromStudentNumber(student.student_number);
      if (detectedType) {
        setFormData((prev) => ({
          ...prev,
          studentType: detectedType,
        }));
      }
    }
  }, [isOpen, student?.student_number]);

  // Fetch items when modal opens and student data is available
  useEffect(() => {
    if (isOpen && student?.id) {
      fetchItems();
    }
  }, [isOpen, student, formData.courseYearLevel, formData.studentType, formData.gender]);

  // Update permissions when student type changes (only for items without existing permissions)
  useEffect(() => {
    if (items.length > 0 && formData.studentType && isOpen) {
      const isOldStudent = String(formData.studentType).toLowerCase() === "old";
      const educationLevel = getEducationLevel(formData.courseYearLevel) || "";
      
      setItemPermissions((prevPermissions) => {
        const updatedPermissions = { ...prevPermissions };
        
        items.forEach((item) => {
          // Only set defaults if this item doesn't have a permission yet
          if (!updatedPermissions[item.normalizedName]) {
            const normalizedItemName = normalizeItemName(item.name);
            const isLogoPatch = normalizedItemName.includes("logo patch");
            
            if (isOldStudent) {
              updatedPermissions[item.normalizedName] = {
                enabled: isLogoPatch, // Only logo patch enabled for old students
                quantity: getDefaultQuantityForItem(
                  item.name,
                  educationLevel,
                  formData.studentType,
                  formData.gender || ""
                ),
              };
            } else {
              updatedPermissions[item.normalizedName] = {
                enabled: true, // All items enabled for new students
                quantity: getDefaultQuantityForItem(
                  item.name,
                  educationLevel,
                  formData.studentType,
                  formData.gender || ""
                ),
              };
            }
          }
        });
        
        return updatedPermissions;
      });
    }
  }, [formData.studentType, items.length, isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({ 
        maxItemsPerOrder: "",
        studentNumber: "",
        name: "",
        courseYearLevel: "",
        studentType: "",
        gender: "",
      });
      setErrors({});
      setItems([]);
      setItemPermissions({});
    }
  }, [isOpen]);

  // Listen for Socket.IO events to refresh permissions when they're updated externally
  // (e.g., when a student places an order and permissions are automatically disabled)
  useEffect(() => {
    if (!isConnected || !isOpen || !student?.id) {
      return;
    }

    const handlePermissionsUpdated = (data) => {
      // Verify this event is for the current student
      if (data.studentId === student.id) {
        // console.log("📡 [EditStudentOrderLimitsModal] Received student:permissions:updated event, refreshing permissions:", data);
        // Refresh permissions by fetching items again
        // This will reload permissions from the database and update the checkboxes
        fetchItems();
      }
    };

    on("student:permissions:updated", handlePermissionsUpdated);

    // Cleanup on unmount or when dependencies change
    return () => {
      off("student:permissions:updated", handlePermissionsUpdated);
    };
  }, [isConnected, isOpen, student?.id, on, off]);

  const fetchItems = async () => {
    if (!student?.id) return;

    const educationLevel = getEducationLevel(formData.courseYearLevel) || 
                          student.education_level || 
                          student.educationLevel || 
                          "";
    
    if (!educationLevel) {
      // Don't fetch if education level is not set yet
      return;
    }

    setLoadingItems(true);
    try {
      // Fetch items directly from the items API (property custodian)
      const studentType = formData.studentType || student.student_type || "new";
      const response = await api.get("/items", {
        params: {
          userEducationLevel: educationLevel,
          studentType: studentType,
          limit: 10000,
          page: 1,
        },
      });

      if (response.data?.success) {
        // Get all items from the response - handle different response structures
        const allItems = response.data?.data?.items || response.data?.data || response.data?.items || [];
        
        if (allItems.length === 0) {
          console.warn("No items returned from API");
          setItems([]);
          setItemPermissions({});
          setLoadingItems(false);
          return;
        }
        
        // Normalize items and remove duplicates by normalized name
        const itemsMap = new Map();
        allItems.forEach((item) => {
          const normalizedName = normalizeItemName(item.name);
          if (!itemsMap.has(normalizedName)) {
            itemsMap.set(normalizedName, {
              id: item.id,
              name: item.name,
              normalizedName: normalizedName,
              category: item.category,
              itemType: item.item_type,
              educationLevel: item.education_level || item.educationLevel,
            });
          }
        });

        const uniqueItems = Array.from(itemsMap.values());
        setItems(uniqueItems);

        // Get existing permissions for this student
        let existingPermissions = {};
        try {
          const permResponse = await studentPermissionsAPI.getStudentItemPermissions(student.id);
          if (permResponse.data?.success && permResponse.data?.data) {
            existingPermissions = permResponse.data.data;
          }
        } catch (permError) {
          console.warn("Could not fetch existing permissions:", permError);
        }

        // Initialize permissions based on student type
        const initialPermissions = {};
        const isOldStudent = String(studentType).toLowerCase() === "old";
        
        uniqueItems.forEach((item) => {
          const defaultQuantity = getDefaultQuantityForItem(
            item.name,
            educationLevel,
            studentType,
            formData.gender || student.gender || ""
          );
          
          // Check if this is a logo patch item
          const normalizedItemName = normalizeItemName(item.name);
          const isLogoPatch = normalizedItemName.includes("logo patch");
          
          // For old students: logo patch is unchecked by default, other items remain unchecked
          // For new students: all items are enabled by default
          let defaultEnabled = false;
          if (isOldStudent) {
            // Logo patch is unchecked by default for old students
            // Other items also remain unchecked (no special treatment)
            defaultEnabled = false;
          } else {
            defaultEnabled = true; // All items enabled for new students
          }
          
          // Use existing permission if available, otherwise use defaults
          const existingPerm = existingPermissions[item.normalizedName];
          if (existingPerm) {
            // Existing permission found - use it
            initialPermissions[item.normalizedName] = {
              enabled: typeof existingPerm === "object" ? existingPerm.enabled : existingPerm,
              quantity: typeof existingPerm === "object" && existingPerm.quantity != null 
                ? existingPerm.quantity 
                : defaultQuantity,
            };
          } else {
            // No existing permission - use defaults
            initialPermissions[item.normalizedName] = {
              enabled: defaultEnabled,
              quantity: defaultQuantity,
            };
          }
        });
        setItemPermissions(initialPermissions);
      } else {
        const errorMsg = response.data?.error || response.data?.message || "Failed to fetch items";
        console.error("Failed to fetch items:", errorMsg);
        toast.error(errorMsg);
        setItems([]);
        setItemPermissions({});
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch items";
      toast.error(errorMsg);
      setItems([]);
      setItemPermissions({});
    } finally {
      setLoadingItems(false);
    }
  };

  const getDefaultQuantityForItem = (itemName, educationLevel, studentType, gender) => {
    // Use the default max from the utility
    return getDefaultMaxForItem(itemName);
  };

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

  const handleItemQuantityChange = (itemName, quantity) => {
    const numericValue = quantity.replace(/[^0-9]/g, "");
    setItemPermissions((prev) => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        quantity: numericValue ? parseInt(numericValue, 10) : null,
      },
    }));
  };

  const handleItemQuantityIncrement = (itemName) => {
    const currentPerm = itemPermissions[itemName] || { enabled: false, quantity: 1 };
    const currentQuantity = currentPerm.quantity || 1;
    setItemPermissions((prev) => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        quantity: currentQuantity + 1,
      },
    }));
  };

  const handleItemEligibilityChange = (itemName, enabled) => {
    setItemPermissions((prev) => ({
      ...prev,
      [itemName]: {
        ...(prev[itemName] || { quantity: 1 }),
        enabled: enabled,
      },
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updateData = buildUpdateData();

    // Save item permissions if student ID exists
    if (student?.id) {
      try {
        const response = await studentPermissionsAPI.updateStudentItemPermissions(
          student.id,
          itemPermissions
        );
        
        if (response.data?.success) {
          toast.success("Student data and item permissions updated successfully");
        } else {
          const errorMsg = response.data?.error || response.data?.message || "Failed to save permissions";
          console.error("Error saving permissions:", errorMsg);
          toast.error(errorMsg);
          return;
        }
      } catch (error) {
        console.error("Error saving permissions:", error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to save item permissions";
        toast.error(errorMsg);
        
        // If table doesn't exist, provide helpful message
        if (errorMsg.includes("does not exist") || errorMsg.includes("42P01")) {
          toast.error("Database table missing. Please run migrations first.");
        }
        return;
      }
    }

    onSave(updateData);
  };

  const buildUpdateData = () => {
    const updateData = {};
    // Total Item Limit is optional - only include if provided
    if (formData.maxItemsPerOrder && formData.maxItemsPerOrder.trim() !== "") {
      updateData.total_item_limit = parseInt(formData.maxItemsPerOrder);
    }
    if (formData.studentNumber !== undefined) {
      updateData.student_number = formData.studentNumber.trim() || null;
    }
    if (formData.name !== undefined) {
      updateData.name = formData.name.trim() || null;
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
    return updateData;
  };

  if (!isOpen) return null;

  const displayName = student ? splitDisplayName(student.name || "").displayName || "Student" : "Student";
  const educationLevel = getEducationLevel(formData.courseYearLevel) || student?.education_level || student?.educationLevel || "";

  // Items are already filtered by education level in fetchItems, so we can use them directly
  const filteredItems = items;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[99999] flex items-center justify-center p-1.5 sm:p-2 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full z-[99999] max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto mx-1.5 sm:mx-2 md:mx-4">
        <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 lg:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#0C2340]">
            <span className="text-[#e68b00]">Edit User</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
            aria-label="Close"
          >
            <X size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-2.5 sm:p-3 md:p-4 lg:p-6 space-y-2.5 sm:space-y-3 md:space-y-4">
          <div className="mb-2.5 sm:mb-3 md:mb-4">
            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">
              Editing: <span className="font-semibold text-[#003363] break-words">{displayName}</span>
            </p>
          </div>

          {/* Student Information - New Layout */}
          <div className="space-y-3 sm:space-y-4">
            {/* Row 1: Student Name (left) and Student Number (right) - side by side on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter student name"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Student Number
                </label>
                <input
                  type="text"
                  value={formData.studentNumber}
                  onChange={(e) => handleInputChange("studentNumber", e.target.value)}
                  placeholder="e.g. 22-11223"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Row 2: Grade Level (left) and Student Type (right) - side by side on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseYearLevel}
                  onChange={(e) => handleInputChange("courseYearLevel", e.target.value)}
                  className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm ${
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
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Student Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.studentType}
                  onChange={(e) => handleInputChange("studentType", e.target.value)}
                  className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm ${
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
              </div>
            </div>

            {/* Row 3: Gender (left) and Total Item Limit (right) - side by side on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm ${
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
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Total Item Limit <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={formData.maxItemsPerOrder}
                    onChange={(e) => handleInputChange("maxItemsPerOrder", e.target.value)}
                    placeholder="e.g. 5"
                    className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-xs sm:text-sm ${
                      errors.maxItemsPerOrder ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleIncrement("maxItemsPerOrder")}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    title="Increment"
                  >
                    <Plus size={16} className="sm:w-[18px] sm:h-[18px] text-gray-600" />
                  </button>
                </div>
                {errors.maxItemsPerOrder && (
                  <p className="text-red-600 text-xs mt-1">{errors.maxItemsPerOrder}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Students cannot place orders until this is set.
                </p>
              </div>
            </div>
          </div>

          {/* Item Eligibility Table - 3 Columns */}
          <div className="mt-3 sm:mt-4 md:mt-6 border-t border-gray-200 pt-3 sm:pt-4 md:pt-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#0C2340] mb-2.5 sm:mb-3 md:mb-4">Item Eligibility</h3>
            
            {loadingItems ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="text-xs sm:text-sm text-gray-500">Loading items...</div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                {educationLevel ? "No items found for this education level." : "Please select Grade Level to see items."}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto -mx-1.5 sm:mx-0">
                <table className="w-full min-w-[320px] sm:min-w-[400px]">
                  <thead className="bg-[#0C2340] text-white">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap">Item Name</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap">Eligible</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const permission = itemPermissions[item.normalizedName] || { enabled: false, quantity: 1 };
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm text-gray-900 break-words">{item.name}</td>
                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                            <input
                              type="checkbox"
                              checked={permission.enabled}
                              onChange={(e) => handleItemEligibilityChange(item.normalizedName, e.target.checked)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#0C2340] border-gray-300 rounded focus:ring-[#0C2340] focus:ring-2"
                            />
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <input
                                type="text"
                                value={permission.quantity || ""}
                                onChange={(e) => handleItemQuantityChange(item.normalizedName, e.target.value)}
                                placeholder="1"
                                className="w-14 sm:w-16 md:w-20 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-[10px] sm:text-xs md:text-sm text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemQuantityIncrement(item.normalizedName)}
                                className="px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                                title="Increment"
                              >
                                <Plus size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 lg:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm md:text-base font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors text-xs sm:text-sm md:text-base font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditStudentOrderLimitsModal;
