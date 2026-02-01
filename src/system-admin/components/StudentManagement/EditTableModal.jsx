import React, { useState, useEffect } from "react";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ItemPermissionsStep from "./ItemPermissionsStep";
import studentPermissionsAPI from "../../../services/studentPermissions.service";
import { toast } from "react-hot-toast";

/**
 * EditTableModal Component
 *
 * Modal for bulk updating selected students' total_item_limit and item permissions (for old students)
 * Step 1: Total Item Limit
 * Step 2: Item Permissions (only shown if at least one selected student is an old student)
 */
const EditTableModal = ({ isOpen, onClose, selectedCount, selectedStudents = [], onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    maxItemsPerOrder: "",
  });
  const [errors, setErrors] = useState({});
  const [hasOldStudents, setHasOldStudents] = useState(false);
  
  // Step 2 state
  const [itemsByEducationLevel, setItemsByEducationLevel] = useState({});
  const [permissions, setPermissions] = useState({});
  const [loadingItems, setLoadingItems] = useState(false);

  // Check if any selected students are old students
  useEffect(() => {
    if (isOpen && selectedStudents.length > 0) {
      const hasOld = selectedStudents.some(
        (student) =>
          (student.studentType && String(student.studentType).toLowerCase() === "old") ||
          (student.student_type && String(student.student_type).toLowerCase() === "old")
      );
      setHasOldStudents(hasOld);
    } else {
      setHasOldStudents(false);
    }
  }, [isOpen, selectedStudents]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ maxItemsPerOrder: "" });
      setErrors({});
      setCurrentStep(1);
      setItemsByEducationLevel({});
      setPermissions({});
    }
  }, [isOpen]);

  // Fetch items when moving to Step 2
  useEffect(() => {
    if (isOpen && currentStep === 2 && hasOldStudents && selectedStudents.length > 0) {
      fetchItemsForPermissions();
    }
  }, [isOpen, currentStep, hasOldStudents, selectedStudents]);

  const handleInputChange = (field, value) => {
    // Only allow numeric values
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
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

    // Check if students are selected
    if (selectedCount === 0) {
      newErrors.general = "Please select at least one student from the table";
      return false;
    }

    // Total Item Limit must be filled
    if (!formData.maxItemsPerOrder) {
      newErrors.general = "Please set Total Item Limit";
    }

    // Validate maxItemsPerOrder if provided
    if (formData.maxItemsPerOrder && parseInt(formData.maxItemsPerOrder) < 1) {
      newErrors.maxItemsPerOrder = "Must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchItemsForPermissions = async () => {
    if (selectedStudents.length === 0) return;

    setLoadingItems(true);
    try {
      // Use the first old student's education level to fetch items
      const oldStudent = selectedStudents.find(
        (s) =>
          (s.studentType && String(s.studentType).toLowerCase() === "old") ||
          (s.student_type && String(s.student_type).toLowerCase() === "old")
      );

      if (!oldStudent) {
        setLoadingItems(false);
        return;
      }

      const educationLevel = oldStudent.education_level || oldStudent.educationLevel || "";
      if (!educationLevel) {
        toast.error("Student education level is required");
        setLoadingItems(false);
        return;
      }

      // Fetch items for the first old student (they should all have the same education level)
      const response = await studentPermissionsAPI.getItemsForStudentPermission(
        oldStudent.id,
        educationLevel
      );

      if (response.data?.success) {
        setItemsByEducationLevel(response.data.data || {});
        
        // Initialize permissions from existing item enabled status
        const initialPermissions = {};
        Object.values(response.data.data || {}).forEach((items) => {
          items.forEach((item) => {
            initialPermissions[item.normalizedName] = item.enabled;
          });
        });
        setPermissions(initialPermissions);
      } else {
        toast.error(response.data?.error || "Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items for permissions:", error);
      toast.error("Failed to fetch items for permission management");
    } finally {
      setLoadingItems(false);
    }
  };

  // Get the first old student for education level (used in render)
  const oldStudent = React.useMemo(() => {
    return selectedStudents.find(
      (s) =>
        (s.studentType && String(s.studentType).toLowerCase() === "old") ||
        (s.student_type && String(s.student_type).toLowerCase() === "old")
    );
  }, [selectedStudents]);

  const handlePermissionChange = (itemName, enabled) => {
    setPermissions((prev) => ({
      ...prev,
      [itemName]: enabled,
    }));
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSave = async () => {
    if (currentStep === 1) {
      // Step 1: Only save total_item_limit
      if (!validateForm()) {
        return;
      }

      const updateData = {};
      if (formData.maxItemsPerOrder) {
        updateData.total_item_limit = parseInt(formData.maxItemsPerOrder);
      }

      onSave(updateData);
    } else {
      // Step 2: Save both total_item_limit and permissions
      const updateData = {};
      if (formData.maxItemsPerOrder) {
        updateData.total_item_limit = parseInt(formData.maxItemsPerOrder);
      }

      // Save permissions for old students only
      const oldStudentIds = selectedStudents
        .filter(
          (s) =>
            (s.studentType && String(s.studentType).toLowerCase() === "old") ||
            (s.student_type && String(s.student_type).toLowerCase() === "old")
        )
        .map((s) => s.id);

      if (oldStudentIds.length > 0) {
        try {
          if (oldStudentIds.length === 1) {
            await studentPermissionsAPI.updateStudentItemPermissions(
              oldStudentIds[0],
              permissions
            );
          } else {
            await studentPermissionsAPI.bulkUpdateStudentItemPermissions(
              oldStudentIds,
              permissions
            );
          }
          toast.success("Permissions updated successfully");
        } catch (error) {
          console.error("Error saving permissions:", error);
          toast.error("Failed to save permissions");
          return;
        }
      }

      onSave(updateData);
    }
  };

  if (!isOpen) return null;

  const showStep2 = hasOldStudents;
  const isStep1 = currentStep === 1;
  const isStep2 = currentStep === 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl ${isStep2 ? "max-w-4xl w-full" : "max-w-md w-full"} z-[10000]`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-[#0C2340]">
              <span className="text-[#e68b00]">Edit Table</span>
            </h2>
            {showStep2 && (
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep} of 2
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Total Item Limit */}
          {isStep1 && (
            <div className="space-y-4">
              {/* Selected Count */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 italic">
                  No. Selected: <span className="font-semibold not-italic">{selectedCount}</span>
                </p>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="text-red-600 text-sm">{errors.general}</div>
              )}

              {/* Total Item Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Item Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.maxItemsPerOrder}
                    onChange={(e) => handleInputChange("maxItemsPerOrder", e.target.value)}
                    placeholder="e.g. 5"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                      errors.maxItemsPerOrder ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleIncrement("maxItemsPerOrder")}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Increment"
                  >
                    <Plus size={20} className="text-gray-600" />
                  </button>
                </div>
                {errors.maxItemsPerOrder && (
                  <p className="text-red-600 text-xs mt-1">{errors.maxItemsPerOrder}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Item Permissions */}
          {isStep2 && (
            <ItemPermissionsStep
              itemsByEducationLevel={itemsByEducationLevel}
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
              loading={loadingItems}
              studentEducationLevel={oldStudent?.education_level || oldStudent?.educationLevel}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div>
            {isStep2 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            {isStep1 && showStep2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTableModal;
