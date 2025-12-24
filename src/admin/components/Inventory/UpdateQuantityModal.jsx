import React from "react";
import { X, ChevronDown } from "lucide-react";

/**
 * UpdateQuantityModal Component
 *
 * Modal for updating inventory quantity with fields:
 * - Item Name
 * - Select field to edit
 * - Quantity
 * - Variant
 * - Unit Price
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-[#0C2340]">
            Update Quantity
          </h2>
          <p className="text-sm text-gray-600 mt-1">Inventory</p>
        </div>

        {/* Form Content */}
        <form
          id="updateQuantityForm"
          className="flex-1 overflow-y-auto bg-gray-50 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Item Name */}
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
                      <option value="quantity">Quantity</option>
                      <option value="price">Price</option>
                      <option value="stock">Stock</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>

                {/* Quantity */}
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
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Variant */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Variant
                  </label>
                  <div className="relative">
                    <select
                      name="variant"
                      value={formData.variant}
                      onChange={onFormChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                    >
                      <option value="">Choose Variant</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="xlarge">XLarge</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>

                {/* Unit Price */}
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="updateQuantityForm"
            className="px-4 py-2 bg-[#E68B00] text-white rounded-lg hover:bg-[#D67A00] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateQuantityModal;
