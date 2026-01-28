import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { splitDisplayName } from "../../../utils/displayName";

/**
 * EditStudentOrderLimitsModal Component
 *
 * Modal for editing a single student's max_items_per_order and order_lockout_period
 * (with unit: Months or Academic Years). Used when the row Edit (pencil) is clicked.
 */
const EditStudentOrderLimitsModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    maxItemsPerOrder: "",
    orderLockoutPeriod: "",
    orderLockoutUnit: "months",
  });

  const [errors, setErrors] = useState({});

  // Prefill from student when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        maxItemsPerOrder:
          student.max_items_per_order != null && student.max_items_per_order !== ""
            ? String(student.max_items_per_order)
            : "",
        orderLockoutPeriod:
          student.order_lockout_period != null && student.order_lockout_period !== ""
            ? String(student.order_lockout_period)
            : "",
        orderLockoutUnit:
          student.order_lockout_unit === "academic_years" ? "academic_years" : "months",
      });
      setErrors({});
    }
  }, [isOpen, student]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        maxItemsPerOrder: "",
        orderLockoutPeriod: "",
        orderLockoutUnit: "months",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    if (field === "orderLockoutUnit") {
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
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
    if (!formData.maxItemsPerOrder && !formData.orderLockoutPeriod) {
      newErrors.general = "Please fill at least one field";
    }
    if (formData.maxItemsPerOrder && parseInt(formData.maxItemsPerOrder) < 1) {
      newErrors.maxItemsPerOrder = "Must be at least 1";
    }
    if (formData.orderLockoutPeriod && parseInt(formData.orderLockoutPeriod) < 0) {
      newErrors.orderLockoutPeriod = "Must be 0 or greater";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updateData = {};
    if (formData.maxItemsPerOrder) {
      updateData.max_items_per_order = parseInt(formData.maxItemsPerOrder);
    }
    if (formData.orderLockoutPeriod) {
      updateData.order_lockout_period = parseInt(formData.orderLockoutPeriod);
      updateData.order_lockout_unit = formData.orderLockoutUnit || "months";
    }

    onSave(updateData);
  };

  if (!isOpen) return null;

  const displayName = student ? splitDisplayName(student.name || "").displayName || "Student" : "Student";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[10000]">
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

          {errors.general && (
            <div className="text-red-600 text-sm">{errors.general}</div>
          )}

          {/* Max Items Per Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Items Per Order
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
            <p className="text-xs text-gray-500 mt-1">
              Maximum quantity of any item a student can reserve in a single transaction
            </p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              Students cannot place orders until Max Items Per Order is set.
            </p>
          </div>

          {/* Order Lockout Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Lockout Period
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={formData.orderLockoutPeriod}
                onChange={(e) => handleInputChange("orderLockoutPeriod", e.target.value)}
                placeholder="e.g. 2"
                className={`flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] ${
                  errors.orderLockoutPeriod ? "border-red-500" : "border-gray-300"
                }`}
              />
              <select
                value={formData.orderLockoutUnit}
                onChange={(e) => handleInputChange("orderLockoutUnit", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] bg-white min-w-[140px]"
              >
                <option value="months">Months</option>
                <option value="academic_years">Academic Years</option>
              </select>
              <button
                type="button"
                onClick={() => handleIncrement("orderLockoutPeriod")}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Increment"
              >
                <Plus size={20} className="text-gray-600" />
              </button>
            </div>
            {errors.orderLockoutPeriod && (
              <p className="text-red-600 text-xs mt-1">{errors.orderLockoutPeriod}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              How long the student is ineligible after a successful claim
            </p>
          </div>
        </div>

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

export default EditStudentOrderLimitsModal;
