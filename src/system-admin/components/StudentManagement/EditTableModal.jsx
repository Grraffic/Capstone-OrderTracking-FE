import React, { useState } from "react";
import { X, Plus } from "lucide-react";

/**
 * EditTableModal Component
 *
 * Modal for bulk updating selected students' total_item_limit
 */
const EditTableModal = ({ isOpen, onClose, selectedCount, onSave }) => {
  const [formData, setFormData] = useState({
    maxItemsPerOrder: "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ maxItemsPerOrder: "" });
      setErrors({});
    }
  }, [isOpen]);

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

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updateData = {};
    if (formData.maxItemsPerOrder) {
      updateData.total_item_limit = parseInt(formData.maxItemsPerOrder);
    }

    onSave(updateData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[10000]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#0C2340]">
            <span className="text-[#e68b00]">Edit Table</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
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
  );
};

export default EditTableModal;
