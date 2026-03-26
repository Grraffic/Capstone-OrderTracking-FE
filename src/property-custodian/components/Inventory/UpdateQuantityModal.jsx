import React from "react";
import { X, ChevronDown } from "lucide-react";
import SearchableSelect from "../common/SearchableSelect";

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
  itemOptions = [],
  variantOptions = [],
  hasRecordedRelease = true,
  releaseCheckLoading = false,
  onItemNameChange,
  onVariantChange,
  onFormChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;
  const isReturnMode = formData.fieldToEdit === "return";

  // Accessories (and any item without meaningful size variants) have only "N/A"
  // or no variant options at all. In those cases hide the variant selector so
  // the user is not required to pick a size that doesn't exist.
  const hasNoMeaningfulVariants =
    variantOptions.length === 0 ||
    (variantOptions.length === 1 && variantOptions[0] === "N/A");

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
                  <SearchableSelect
                    value={formData.itemName}
                    onChange={(value) => {
                      if (typeof onItemNameChange === "function") {
                        onItemNameChange(value);
                      } else {
                        onFormChange({ target: { name: "itemName", value } });
                      }
                    }}
                    options={itemOptions}
                    placeholder="Select Item Name"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Variant
                  </label>
                  {hasNoMeaningfulVariants && formData.itemName ? (
                    <div className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-500 italic">
                      No size variant (Accessories)
                    </div>
                  ) : (
                    <select
                      name="variant"
                      value={formData.variant}
                      onChange={(e) => {
                        if (typeof onVariantChange === "function") {
                          onVariantChange(e.target.value);
                        } else {
                          onFormChange(e);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.itemName}
                      required={!hasNoMeaningfulVariants}
                    >
                      <option value="">Choose Variant</option>
                      {variantOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
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
                    <option value="purchases">Purchases</option>
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
                    readOnly={isReturnMode}
                    placeholder={
                      isReturnMode
                        ? "Auto-filled from current item price"
                        : "Enter Unit Price"
                    }
                    className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReturnMode
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  />
                  {isReturnMode && (
                    <p className="text-xs text-gray-500">
                      Auto-filled based on selected item and variant.
                    </p>
                  )}
                </div>
              </div>

              {isReturnMode && !releaseCheckLoading && !hasRecordedRelease && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-amber-800">
                    Warning: No recorded releases for this item. Add a legacy
                    return remark before saving.
                  </p>
                </div>
              )}

              {isReturnMode && releaseCheckLoading && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-blue-700">
                    Checking release history...
                  </p>
                </div>
              )}

              {isReturnMode && !releaseCheckLoading && !hasRecordedRelease && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Remarks <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ""}
                    onChange={onFormChange}
                    placeholder="Enter reason (e.g., Legacy Return)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
              )}
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
