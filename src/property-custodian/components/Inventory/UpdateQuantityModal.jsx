import React from "react";
import { X, ChevronDown } from "lucide-react";

/**
 * UpdateQuantityModal Component
 *
 * Modal for updating inventory quantity with fields:
 * - Item Name
 * - Item Name and Variant (same row)
 * - Select field to edit
 * - Quantity and Unit Price (same row)
 */
const UpdateQuantityModal = ({
  isOpen,
  formData,
  onFormChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col font-sf-medium">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0C2340]">
                Add Inventory
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Inventory</p>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form
          id="updateQuantityForm"
          className="flex-1 overflow-y-auto bg-gray-50 px-4 sm:px-6 py-4 sm:py-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="max-w-2xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Item Name and Variant - same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={onFormChange}
                    placeholder="Enter Item Name"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Variant
                  </label>
                  <input
                    type="text"
                    name="variant"
                    value={formData.variant}
                    onChange={onFormChange}
                    placeholder="Enter Variant
                    "
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Select field to edit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Select field to edit
                </label>
                <div className="relative">
                  <select
                    name="fieldToEdit"
                    value={formData.fieldToEdit}
                    onChange={onFormChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                  >
                    <option value="">Select field</option>
                    <option value="return">Return</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Quantity and Unit Price - same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={onFormChange}
                    placeholder="Enter Quantity"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={onFormChange}
                    placeholder="Enter Unit Price"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer with Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="updateQuantityForm"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#E68B00] text-white rounded-lg hover:bg-[#D67A00] transition-colors text-sm sm:text-base font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateQuantityModal;
